let express = require('express');
let path = require('path');
let fs = require('fs');
let url = require('url');
let bodyParser = require('body-parser');
let session = require('express-session');
let multer = require('multer');
let mongoose = require('mongoose');
let app = express();
/**
 * Multer configuration
 */
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let s = path.join(path.resolve(__dirname, '../'), 'public', 'images');
        req.somepath = s;
        req.fileName = file.originalname;
        console.log('the file object ', s, req.somepath, req.fileName, file.originalname);
        req.originalName = file.originalname.substr(0, file.originalname.indexOf('.'));
        cb(null, s);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

let GlobalFileName = "";
let GlobalFileType = "";
let GlobalOriginalName = "";

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({
    secret: 'mehdi_rimas',
    resave: false,
    saveUninitialized: false,
}));


let Multer = multer({storage: storage});
let uploadMiddleWare = Multer.any();

let Student = require('../models/Student');
let Request = require('../models/PendingRequest');
let Pending = require('../models/PendingStudents');
let Lesson = require('../models/Lessons');
let Test = require('../models/Test');

app.get('/', (req, res) => {
    if (req.session.isConnected) {

        Lesson.find({}, (err, lessons) => {
            if (err) throw err;
            Test.find({}, (err, tests) => {
                if (err) throw err;
                res.render('student/index', {
                    title: 'home',
                    name: req.session.name,
                    page: 'partials/home',
                    image: req.session.image,
                    tests: tests,
                    lessons: lessons,
                    lessonsCount: req.session.lessonsDone,
                    testsCount: req.session.testsDone,
                    progress: req.session.progress
                });
            })
        })
    } else {
        res.redirect('/student/signin');
    }
});


app.get('/images/:name', (req, res) => {
    let name = req.params.name.trim();
    let firstName = name.split(" ")[0];
    let lastName = name.split(" ")[1];
    console.log('first name : ', firstName, ' last name ', lastName);

    Student.findOne({firstName: firstName, lastName: lastName}, (err, data) => {
        if (err) {
            res.status(404);
            res.end();
        } else {
            data = data || {};
            data.image = data.image || 'user.png';
            res.status(200);
            res.send(data.image);
            res.end();
        }
    })
});

app.get('/signin', (req, res) => {
    if (req.session.isConnected) {
        res.redirect('/student');
    } else {
        res.render('student/signin', {error: null});
    }
});

app.post('/signin', (req, res) => {

    let name = req.body.name.trim();
    let password = req.body.password;
    if (!name || !password) {
        res.render('student/signin', {error: ' credentials does not match '});
    } else {
        let firstname = "", lastname = "";
        if (name.split("_").length === 2) {
            firstname = name.split("_")[0].trim();
            lastname = name.split("_")[1].trim();
        }

        Student.findOne({
            $or: [
                {firstName: firstname, lastName: lastname, password: password},
                {email: name, password: password}
            ]
        }).exec(function (err, user) {
            if (user) {
                req.session.isConnected = true;
                req.session.name = [user.firstName, user.lastName].join(" ");
                req.session.image = user.image || 'user.png';
                req.session.testsDone = user.tests;
                req.session.lessonsDone = user.lessons;
                req.session.progress = user.progress;
                res.redirect('/student');
            }
            else {
                res.render('student/signin', {error: ' credentials does not match '});
            }
        });
    }
});


app.post('/signup', (req, res) => {
    console.log('in the post rout of the signup ', JSON.stringify(req.body));
    uploadMiddleWare(req, res, (err) => {
        console.log('multer in the post rout of the signup ', JSON.stringify(req.body));
        let name = req.body.nom;
        let surname = req.body.surname;
        let email = req.body.email;
        let cne = req.body.cne;
        let phone = req.body.phone;
        let password = req.body.password;
        let image = req.fileName || 'user.png';

        console.log('the file name of multer is ', image);

        if (!name || !surname || !email || !cne || !password) {
            res.render('student/signup', {errors: 'please fill all the required fields !'})
        } else {
            let NewPendingStudent = new Pending({
                firstName: name.trim(),
                lastName: surname.trim(),
                email: email.trim(),
                cne: cne.trim(),
                phone: phone,
                password: password,
                image: image
            });

            NewPendingStudent.save((err) => {
                if (err) throw err;
                let NewRequest = new Request({
                    fullName: [name, surname].join(" "),
                    email: email,
                    image: image
                });
                NewRequest.save((err) => {
                    if (err) throw err;
                    console.log('request saved with success');
                    res.redirect('/student/signin');
                });
            })
        }
    })
});

app.get('/chat', (req, res) => {
    if (!req.session.isConnected) {
        res.redirect('/student/signin');
    } else {
        res.render('student/partials/chat', {
            page: 'partials/chat',
            name: req.session.name,
            title: 'Chat',
            image: req.session.image
        });
    }
});

function getStudent(name, callback) {
    let firstName = name.split(" ")[0];
    let lastName = name.split(" ")[1];

    Student.findOne({firstName: firstName, lastName: lastName}, (err, data) => {
            if (err) throw err;
            callback(data);
        }
    )
}

app.get('/profile', (req, res) => {
    if (!req.session.isConnected) {
        res.redirect('/student/signin');
    } else {
        getStudent(req.session.name, function (student) {
            res.render('student/index', {
                page: 'partials/details',
                name: req.session.name,
                title: 'Profile',
                image: req.session.image,
                cne: student.cne,
                email: student.email
            });
        })
    }
});
app.post('/profile', (req, res) => {
    uploadMiddleWare(req, res, err => {
        let name = req.session.name;
        let firstName = name.split(" ")[0];
        let lastName = name.split(" ")[1];
        console.log('this is the post route of the profile ', req.body);
        Student.findOne({firstName: firstName, lastName: lastName}, (err, data) => {
            if (err) throw err;
            data.email = req.body.email || data.email;
            req.body.password = req.body.password.length == 0 ? undefined : req.body.password;
            data.password = req.body.password || data.password;
            data.image = req.fileName || data.image;
            req.session.image = data.image;
            data.save(function (err, todo) {
                if (err) throw err;
                res.redirect('/student');
            })
        })
    })
});

app.get('/increment/tests/:name', (req, res) => {
    let testName = req.params.name;
    let name = req.session.name;
    let firstName = name.split(" ")[0];
    let lastName = name.split(" ")[1];
    Student.findOne({firstName: firstName, lastName: lastName}, (err, student) => {
        if (err) throw err;
        let testsDone = student.testsDone || [];
        let lessonsDone = student.lessonsDone || [];
        lessonsDone = [...new Set(lessonsDone)];
        testsDone.push(testName);
        let newTests = [...new Set(testsDone)];
        let total = newTests.length + lessonsDone.length;
        getTotalLessons((globalTotal) => {
            student.progress = Math.round(total / globalTotal * 100.0);
            student.testsDone = newTests;
            student.lessonssDone = lessonsDone;
            console.log('TEST ROUTE: those are the new lessons ', student.lessonssDone, student.testsDone);
            student.save(function (err) {
                let sendObject = {
                    lessons: lessonsDone.length,
                    tests: newTests.length,
                    progression: student.progress
                };
                req.session.progress = sendObject.progression;
                req.session.progress = sendObject.progression;
                res.status(200);
                res.json(sendObject);
            })
        })
    })
});

app.get('/increment/lessons/:name', (req, res) => {
    let testName = req.params.name;
    let name = req.session.name;
    let firstName = name.split(" ")[0];
    let lastName = name.split(" ")[1];
    Student.findOne({firstName: firstName, lastName: lastName}, (err, student) => {
        if (err) throw err;
        let testsDone = student.testsDone || [];
        let lessonsDone = student.lessonsDone || [];
        lessonsDone.push(testName);
        let newLessons = [...new Set(lessonsDone)];
        let total = testsDone.length + newLessons.length;
        getTotalLessons((globalTotal) => {
            student.progress = Math.round(total / globalTotal * 100.0);
            student.testsDone = testsDone;
            student.lessonssDone = newLessons;
            console.log('LESSON ROUTE: those are the new lessons ', student.lessonssDone, student.testsDone);
            student.save(function (err) {
                let sendObject = {
                    lessons: newLessons.length,
                    tests: testsDone.length,
                    progression: student.progress
                };
                req.session.progress = sendObject.progression;
                res.status(200);
                res.json(sendObject);
            })
        })
    })
});

function getTotalLessons(calback) {
    Test.count({}, (err, testCount) => {
        if (err) throw err;
        Lesson.count({}, (err, lessonsCount) => {
            if (err) throw err;
            calback(testCount + lessonsCount);
        })
    })
}
app.get('/signup', (req, res) => {
    console.log('in the signup route ');
    if (req.session.isConnected) {
        res.redirect('/student');
    } else {
        res.render('student/signup');
    }
});


app.get('/disconnect', (req, res) => {
    delete req.session.isConnected;
    delete req.session.name;
    delete req.session.image;
    res.redirect('/student/signin');
});
app.get('/:type/:filename/:original', (req, res) => {
    GlobalFileName = req.params.filename;
    GlobalFileType = req.params.type;
    GlobalOriginalName = req.params.original;

    res.sendFile(path.join(path.resolve(__dirname, '../'), 'uploads', GlobalFileType, GlobalFileName, GlobalOriginalName, 'index.html'));
});
app.get('/*', (req, res) => {
    let currentPath = req.url.slice(1);
    currentPath = currentPath.substr(currentPath.indexOf('/'));
    currentPath = currentPath.slice(1);
    currentPath = currentPath.substr(currentPath.indexOf('/'));
    let resolved = path.join(path.resolve(__dirname, '../'), 'uploads', GlobalFileType, GlobalFileName, GlobalOriginalName, currentPath);
    res.sendFile(resolved);
});

module.exports = app;
let mongoose = require('mongoose');
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io').listen(http);
let multer = require('multer');
let path = require('path');
let fs = require('fs');
let url = require('url');
let unzipper = require('unzipper');
let bodyParser = require('body-parser');
let session = require('express-session');

/**
 * Shared global variables to store the unzipped files
 * @type {string}
 */
let GlobalFileName = "";
let GlobalFileType = "";
let GlobalOriginalName = "";


/**
 * Multer Configuration
 */
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let type = req.body.type;
        let s = path.join(path.resolve(__dirname, '../'), 'uploads', type);
        req.somepath = s;
        req.fileName = file.originalname;
        console.log('in the multer configuration ', req.fileName);
        req.originalName = file.originalname.substr(0, file.originalname.indexOf('.'));
        cb(null, s);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});


app.set('view engine', 'ejs');

app.use('/profiles', express.static('public'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({
    secret: 'mehdi_rimas',
    resave: false,
    saveUninitialized: false,
}));

//mongoose.connect('mongodb://localhost:27017/petra');

/**
 * Models setup
 */
let Student = require('../models/Student');
let Admin = require('../models/Admin');
let Test = require('../models/Test');
let Lesson = require('../models/Lessons');
let Request = require('../models/PendingRequest');
let Pending = require('../models/PendingStudents');

let Multer = multer({storage: storage});
let uploadMiddleWare = Multer.any();

app.get('/', (req, res) => {
    if (req.session.isConnected) {
        getRequests(function (count) {
            console.log('the number of requests is ', count);
            res.render('admin/index', {
                title: 'home',
                name: req.session.name,
                page: 'partials/home',
                count: count
            });
        })

    } else {
        res.redirect('/admin/signin');
    }
});

app.get('/signin', (req, res) => {
    console.log('in the signin rout with ', req.url);
    if (req.session.isConnected) {
        res.redirect('/admin');
    } else {
        res.render('admin/signin', {error: null});
    }
});

app.get('/chat', (req, res) => {
    if (!req.session.isConnected) {
        res.redirect('/admin/signin');
    } else {
        getRequests(function (count) {
            Request.find({}, (err, data) => {
                if (err) throw err;
                res.render('admin/index', {
                    title: 'chat',
                    name: req.session.name,
                    page: 'partials/chat',
                    count: count,
                    requests: data
                });
            });
        });
    }
})
app.post('/signin', (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    console.log('in the post request ', name, password);
    if (!name || !password) {
        res.render('admin/signin', {error: ' credentials does not match '});
    } else {
        Admin.findOne({
            $or: [
                {email: name, password: password},
                {fullName: name, password: password}
            ]
        }).exec(function (err, user) {
            if (user) {
                req.session.isConnected = true;
                req.session.name = user.fullName;
                res.redirect('/admin');
            }
            else {
                res.render('admin/signin', {error: ' credentials does not match '});
            }
        });

    }
});

app.get('/requests', (req, res) => {
    if (!req.session.isConnected) {
        res.redirect('/admin');
    } else {
        getRequests(function (count) {
            Request.find({}, (err, data) => {
                if (err) throw err;
                res.render('admin/index', {
                    title: 'home',
                    name: req.session.name,
                    page: 'partials/requests',
                    count: count,
                    requests: data
                });
            });
        });
    }
});

app.post('/create', (req, res) => {
    uploadMiddleWare(req, res, (err) => {
        if (err) {
            console.log('an error occured');
            throw err;
        }
        let parts = url.parse(req.url, true).query;
        console.log('parts are : ', parts);
        let toExtract = path.join(req.somepath, req.fileName);
        fs.createReadStream(toExtract)
            .pipe(unzipper.Extract({path: path.join(path.resolve(__dirname, '../'), 'uploads', req.body.type, req.body.filename)}));
        fs.unlink(toExtract, (err) => {
            if (parts.src === 'tests') {
                let test = new Test({
                    author: req.session.name,
                    name: req.body.filename,
                    path: path.join(req.body.type, req.body.filename),
                    type: req.body.type,
                    originalName: req.originalName
                });
                test.save();
            } else {
                let lesson = new Lesson({
                    author: 'marjan',
                    name: req.body.filename,
                    path: path.join(req.body.type, req.body.filename),
                    type: req.body.type,
                    originalName: req.originalName
                });
                lesson.save();
            }
            res.redirect('/admin/' + parts.src);
        });
    });
});

app.get('/disconnect', (req, res) => {
    delete req.session.isConnected;
    delete req.session.name;
    res.redirect('/admin/signin');
});

app.get('/tests', (req, res) => {
    getRequests(function (count) {
        if (!req.session.isConnected) {
            res.redirect('/admin/signin');
        }
        Test.find({}, (err, data) => {
            if (err) throw err;
            res.render('admin/index', {
                title: ' Tests ',
                name: req.session.name,
                page: 'partials/tests',
                tests: data,
                count: count
            })
        });
    })
});

app.get('/:type/:filename/:original', (req, res) => {
    GlobalFileName = req.params.filename;
    GlobalFileType = req.params.type;
    GlobalOriginalName = req.params.original;

    res.sendFile(path.join(path.resolve(__dirname, '../'), 'uploads', GlobalFileType, GlobalFileName, GlobalOriginalName, 'index.html'));
});


app.get('/lessons', (req, res) => {
    getRequests(function (count) {
        Lesson.find({}, function (err, data) {
            if (err) throw err;
            res.render('admin/index', {
                title: ' Lessons ',
                name: req.session.name,
                page: 'partials/lessons',
                lessons: data,
                count: count
            })
        });
    })
});

/**
 * responding to ajax calls
 */
app.delete('/delete/student/:name', (req, res) => {
    let name = req.params.name.trim().split(" ");
    console.log('in the delete url with name = ', name);
    Student.remove({firstName: name[0], lastName: name[1]}, function (err) {
        res.status(200);
        res.end();
    })
});

app.delete('/delete/request/:name', (req, res) => {
    let name = req.params.name.trim();
    removeFromPending(name, function () {
        res.status(200);
        res.end();
    })
});

app.delete('/accept/request/:name', (req, res) => {
    let name = req.params.name.trim();
    let splited = name.split(" ");
    Pending.findOne({firstName: splited[0], lastName: splited.splice(1).join(" ")}, (err, data) => {
        if (err) throw err;
        let newstd = {
            firstName: data.firstName,
            lastName: data.lastName,
            cne: data.cne,
            email: data.email,
            image: data.image,
            phone: data.phone,
            password: data.password,
            progress: 0,
            tests: 0,
            lessons: 0
        };

        let newStudent = new Student(newstd);

        newStudent.save((err) => {
            removeFromPending(name, function () {
                res.status(200);
                res.end();
            })
        })
    });
});

app.delete('/delete/:name/:type', (req, res) => {
    let name = req.params.name;
    let type = req.params.type;

    let p = path.join(path.resolve(__dirname, '../'), 'uploads', type, name).trim();
    removeDirectory(p);
    if (type === 'tests') {
        Test.remove({name: name}, (err) => {
            if (err) {
                console.log(err);
                res.status(500);
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        })

    } else {
        Lesson.remove({name: name}, (err) => {
            if (err) {
                res.status(500);
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        })
    }
});


app.get('/list', (req, res) => {
    if (!req.session.isConnected) {
        res.redirect('/admin/signin');
    } else {
        getRequests(function (count) {
            Student.find({}, (err, data) => {
                if (err) throw err;
                res.render('admin/index', {
                    page: 'partials/list',
                    students: data,
                    title: 'student list',
                    name: req.session.name,
                    count: count
                })
            })
        })
    }
});


app.get('/profiles/:fullname', (req, res) => {
    let fullName = req.params.fullname.split('-');
    getRequests(function (count) {
        Student.findOne({firstName: fullName[0], lastName: fullName[1]}, (err, data) => {
            if (err) throw err;
            console.log(data);
            let image = data.image || 'user.png';
            res.render('admin/index', {
                page: 'partials/profile',
                student: data,
                image: image,
                title: fullName[0] + ' ' + fullName[1] + ' profile ',
                name: req.session.name,
                count: count
            });
        });
    })
});

app.get('/*', (req, res) => {
    console.log('the url ', req.url);
    let currentPath = req.url.slice(1);
    currentPath = currentPath.substr(currentPath.indexOf('/'));
    currentPath = currentPath.slice(1);
    currentPath = currentPath.substr(currentPath.indexOf('/'));
    console.log('the current path ', currentPath);
    let resolved = path.join(path.resolve(__dirname, '../'), 'uploads', GlobalFileType, GlobalFileName, GlobalOriginalName, currentPath);
    res.sendFile(resolved);
});

/**
 * remove a directory recursively and synchronously
 * @param p
 */

function removeDirectory(p) {
    fs.readdirSync(p).forEach(function (file) {
        let cur = path.join(p, file);
        if (fs.statSync(cur).isDirectory()) {
            removeDirectory(cur);
        } else {
            fs.unlinkSync(cur);
        }
    });
    fs.rmdir(p);
}


/**
 * getting the number of current requests from the database
 * @param callback
 */
function getRequests(callback) {
    Request.count({}, (err, count) => {
        callback(count);
    })
}


function removeFromPending(name, callback) {
    let splitedName = name.split(" ");
    let firstName = splitedName[0],
        lastName = splitedName.splice(1).join(" ");

    Pending.find({firstName: firstName, lastName: lastName}, (err, data) => {

        if (err) throw err;
        console.log('the retreived value is ', JSON.stringify(data));

        Pending.remove({firstName: firstName, lastName: lastName}, (err) => {
            if (err) throw err;
            Request.remove({fullName: name}, (err) => {
                if (err) throw err;
                callback();
            })
        })

    })
}

module.exports = app;
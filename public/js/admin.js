/**
 * @authors {MaxHeap, RimasBen}
 */

let socket = io.connect();
let spinner = document.getElementById('spinner');
let html = $('#wrapper-removed').html();
let users = {};
let to = '';

socket.on('student_list', (data) => {
    let list = data.list;
    let row = document.querySelector('.row');
    console.log('the data from the list ' , list);
    if (list.length > 0) {
        $('#wrapper-removed').remove();
        for(let name of list){
            if(users[name]) continue;
            let cur = createNewUser(name);
            users[name] = true;
            row.appendChild(cur);
        }
    } else {
        while(row.hasChildNodes()){
            row.removeChild(row.lastChild);
        }
        users = {};
        row.appendChild(createWrapper());
    }
});

function createNewUser(name) {
    let col = document.createElement('div');
    let link = document.createElement('a');
    let studentContainer = document.createElement('div');
    let studentImage = document.createElement('div');
    let image = document.createElement('img');
    let studentName = document.createElement('div');
    image.src = 'images/pc.svg';
    col.className = "col s3";
    studentName.textContent = name;
    studentName.className = 'student-name';
    studentContainer.className = 'student';
    studentImage.className = 'student-image';
    studentImage.appendChild(image);
    link.appendChild(studentContainer);
    studentContainer.appendChild(studentImage);
    studentContainer.appendChild(studentName);
    col.appendChild(link);
    link.href = '#vid';
    link.addEventListener('click', (e) =>{
       // e.preventDefault();
        to = link.querySelector('.student-name').textContent;
        // call the user with the name => name
    })
    return col;
}
function createWrapper(){
    let col = document.createElement('div');
    col.className = 'col s6 offset-s3';
    col.id = "wrapper-removed";
    $(col).html(html);
    return col;
}
function getName(link) {
    return link.querySelector('.student-name').textContent;
}
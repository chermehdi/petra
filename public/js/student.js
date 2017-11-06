let password = document.getElementById('password');
let passwordConf = document.getElementById('password_conf');
let name = document.getElementById('name');
let email = document.getElementById('email');
let cne = document.getElementById('cne');
let surname = document.getElementById('surname');
let formOk = true;
let passwordConfTouched = false;

function isOk() {
    return formOk;
}
/*
 Validation of text fields , with error messages
 */
password.addEventListener('keyup', (e) => {
    let val = password.value;
    let confVal = passwordConf.value;
    if (passwordConfTouched) {
        if (val !== confVal) {
            passwordConf.classList.remove('valid');
            passwordConf.classList.add('invalid');
            password.classList.remove('valid');
            password.classList.add('invalid');
            formOk = false;
        } else {
            formOk = true;
            password.classList.remove('invalid');
            passwordConf.classList.remove('invalid');
            password.classList.add('valid');
            passwordConf.classList.add('valid');
        }
    }
});

passwordConf.addEventListener('keyup', (e) => {
    passwordConfTouched = true;
    let val = password.value;
    let confVal = passwordConf.value;
    if (val !== confVal) {
        passwordConf.classList.remove('valid');
        passwordConf.classList.add('invalid');
        password.classList.remove('valid');
        password.classList.add('invalid');
        formOk = false;
    } else {
        password.classList.remove('invalid');
        passwordConf.classList.remove('invalid');
        password.classList.add('valid');
        passwordConf.classList.add('valid');
        formOk = true;
    }
});
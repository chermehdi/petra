function showSnackBar(message, color) {
    let snackBar = document.getElementById('snackbar');
    snackBar.textContent = message;
    snackBar.style.backgroundColor = color;
    snackBar.classList.add('show');
    setTimeout(function () {
        snackBar.classList.remove('show');
    }, 3000);
}
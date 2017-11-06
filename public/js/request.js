let deleteLinks = document.querySelectorAll('.delete');
let acceptLinks = document.querySelectorAll('.accept');

let form = document.getElementById('form-in');

for (let i = 0; i < deleteLinks.length; i++) {
    let self = deleteLinks[i];
    self.addEventListener('click', function (e) {
        e.preventDefault();
        doAjaxRemove(e.target, '/admin/delete/request', function (message, error) {
            // remove the containing  div
            let $target = $(e.target.parentElement.parentElement);
            console.log(' the target is ', $target);
            if (error) {
                showSnackBar('an error has occurred', '#f44336');
            } else {
                showSnackBar(message, '#4CAF50');
                $target.hide('slow', function () {
                    $target.remove();
                });
            }
        });
    });
}
for (let i = 0; i < acceptLinks.length; i++) {
    let self = acceptLinks[i];
    self.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('sending a request with ', e.target , ' as the target element');
        doAjaxRemove(e.target, '/admin/accept/request', function (message, error) {
            // remove the containing  div
            let $target = $(e.target.parentElement.parentElement);
            console.log(' the target is ', $target);
            if (error) {
                showSnackBar('an error has occurred', '#f44336');
            } else {
                showSnackBar(message, '#4CAF50');
                $target.hide('slow', function () {
                    $target.remove();
                });
            }
        });
    });
}

function doAjaxRemove(link, url, callback) {
    let xhr = new XMLHttpRequest();
    let name = link.dataset.name;

    xhr.onreadystatechange = function () {
        if (xhr.status === 200 && xhr.readyState === 4) {
            if (isDelete(url)) {
                callback('Demande supprimer avec succee !', false); // false means no errors
            } else {
                callback('Demande accepter avec succee !', false);
            }
        } else {
            callback('an error has occured', true);
        }
    };

    xhr.open('DELETE', url + '/' + name, true);
    xhr.send(null);
}

function isDelete(url) {
    return url.split("/").indexOf("accept") === -1;
}
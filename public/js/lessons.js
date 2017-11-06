let links = document.querySelectorAll('.delete');

for (let i = 0; i < links.length; i++) {
    let self = links[i];
    self.addEventListener('click', function (e) {
        e.preventDefault();
        doAjaxRemove(e.target, function (message, error) {
            // remove the containing  div
            let $target = $(e.target.parentElement.parentElement.parentElement);
            if (error) {
                showSnackBar('an error has occured', '#f44336');
            } else {
                showSnackBar(message, '#4CAF50');
                $target.hide('slow', function () {
                    $target.remove();
                });
            }
        });
    });
}

function doAjaxRemove(link, callback) {
    let xhr = new XMLHttpRequest();
    let type = link.dataset.type;
    let name = link.dataset.name;
    console.log('you tried to remove this link ', link);
    xhr.onreadystatechange = function () {
        if (xhr.status === 200 && xhr.readyState === 4) {
            if (type === 'tests') {
                callback('Lesson supprimer avec succee !', false); // false means no errors
            } else {
                callback('Lesson supprimer avec succee !', false);
            }
        } else {
            callback('an error has occured', true);
        }
    };

    xhr.open('DELETE', '/admin/delete/' + name + '/' + type, true);
    xhr.send(null);
}
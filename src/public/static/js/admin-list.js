function removeWord(id) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            window.location.replace("/admin");
        }
    };
    var fd = new FormData();
    fd.append("id", id);
    xhr.open("POST", "/admin/remove", true);
    xhr.send(fd);
}
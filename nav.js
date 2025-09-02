// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    // Fetch the navigation bar HTML
    fetch("navbar.html")
        .then(response => response.text())
        .then(data => {
            // Insert the navigation bar into the placeholder
            document.getElementById("navbar-placeholder").innerHTML = data;
        });
});
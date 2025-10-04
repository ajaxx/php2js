<?php
// Array access - should work
$name = $_POST['name'];

// Direct reference - needs fixing
if (isset($_POST)) {
    $data = $_POST;
}

// In function call
if (!empty($_POST)) {
    process($_POST);
}

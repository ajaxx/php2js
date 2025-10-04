<?php
$title = "Test Page";
$name = "World";
?>
<!DOCTYPE html>
<html>
<head>
    <title><?php echo $title; ?></title>
</head>
<body>
    <h1>Hello <?= $name ?>!</h1>
    <p>This is a test with multiple lines.</p>
    <div class="container">
        <span>Each line should be wrapped separately</span>
    </div>
</body>
</html>
<?php
echo "Done!";
?>

<?php

function greet($name) {
    $message = "Hello, " . $name;
    echo $message;
    return true;
}

class User {
    public function getName() {
        return $this->name;
    }
}

$title = "Test";
$count = 42;

if ($count > 10) {
    echo "Large count";
} else {
    echo "Small count";
}

foreach ($items as $item) {
    echo $item;
}

<?php
// Test to ensure method calls aren't broken by string concatenation conversion

$user = new User();
$name = $user->getName();
$email = $user->getEmail();

// String concatenation should still work
$fullInfo = $name . " <" . $email . ">";
echo $fullInfo;

// Method chaining
$result = $user->setName("John")->setEmail("john@example.com")->save();

// Mixed: method calls and concatenation
$greeting = "Hello, " . $user->getName() . "!";
echo $greeting;

// Compound assignment
$message = "User: ";
$message .= $user->getName();
?>

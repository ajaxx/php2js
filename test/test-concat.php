<?php
// Test string concatenation
$firstName = "John";
$lastName = "Doe";

// Using . operator
$fullName = $firstName . " " . $lastName;
echo $fullName;

// Using .= operator
$message = "Hello";
$message .= " ";
$message .= "World";
echo $message;

// Mixed with variables
$greeting = "Welcome, " . $fullName . "!";
echo $greeting;
?>

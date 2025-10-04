<?php
// Test object and static operators

class User {
    public $name;
    public $email;
    
    public function getName() {
        return $this->name;
    }
    
    public static function getInstance() {
        return new self();
    }
}

$user = new User();
$user->name = "John";
$user->email = "john@example.com";

// Object method calls
$name = $user->getName();
$email = $user->getEmail();

// Chained method calls
$result = $user->setName("Jane")->setEmail("jane@example.com")->save();

// Static method calls
$instance = User::getInstance();
$config = Config::get('database');

// Property access
echo $user->name;
echo $user->email;

// Nested object access
$address = $user->profile->address->street;
?>

<?php
class User {
    // Public properties
    public $name;
    public $email = 'default@example.com';
    
    // Private properties
    private $password;
    private $id = 0;
    
    // Protected property
    protected $role = 'user';
    
    // Property without visibility (defaults to public)
    $status = 'active';
    
    // Constructor
    public function __construct($name, $email) {
        $this->name = $name;
        $this->email = $email;
    }
    
    // Public method
    public function getName() {
        return $this->name;
    }
    
    // Private method
    private function validatePassword($password) {
        return strlen($password) >= 8;
    }
    
    // Protected method
    protected function setRole($role) {
        $this->role = $role;
    }
    
    // Method without visibility (defaults to public)
    function getStatus() {
        return $this->status;
    }
}

class Admin extends User {
    public $permissions = array();
    
    public function __construct($name, $email) {
        parent::__construct($name, $email);
        $this->setRole('admin');
    }
}

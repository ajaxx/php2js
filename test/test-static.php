<?php
class Database {
    // Static properties
    public static $connection = null;
    private static $instance = null;
    
    // Static methods
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private static function connect() {
        return 'Connected';
    }
    
    // Regular method using static
    public function query() {
        return self::connect();
    }
}

// Usage
$db = Database::getInstance();

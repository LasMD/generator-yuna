<?php
namespace Util;

class Pool
{
    private static $reference = null;
    private $connection;
    private $isAlive = false;
    private $base;
    private $user;
    private $port;
    private $password;
    private $driver;

    /**
     * Pool constructor.
     */
    private function __construct()
    {
        $this->driver = "mysql";
        $this->base = "ssstravels";
        $this->user = "root";
        $this->password = "user";
        $this->port = 3307;
        try {
            $this->connection = new PDO("$this->driver:host=localhost;dbname=$this->base;port=$this->port", $this->user, $this->password,
              array(
                PDO::ATTR_PERSISTENT => true,
                PDO::ATTR_AUTOCOMMIT => true,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES UTF8"
              ));
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->isAlive = true;
        } catch (PDOException $ex) {
            $this->connection = null;
            $x = $ex->getMessage();
            echo "<script type='text/javascript'>console.log($x)</script>";
            $this->isAlive = false;
            die("Internal Server Error Occured");
        }
    }

    public function __destruct()
    {
        $this->connection = null;
    }

    /**
     * This function ensures a singleton Pool connection.
     * @return Pool
     */
    public static function Handler()
    {
        if (is_null(Pool::$reference)) {
            Pool::$reference = new Pool();
        }
        return Pool::$reference;
    }


    /**
     * get Worker for database
     * @return PDO
     */
    public function Worker()
    {
        return $this->connection;
    }


    /**
     * returning status of the connection
     * @return bool
     */
    public function WorkerStatus()
    {
        return $this->isAlive;
    }
}
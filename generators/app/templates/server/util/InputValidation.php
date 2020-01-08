<?php

class InputValidation
{

    public $input_data = array();

    public function __construct($data)
    {
        if (is_null($data) && !isset($data) && !is_array($data)) {
            throw new Exception("Unbounded data array with unbounded format");
        } else {
            $this->input_data = $data;
        }
    }

    /**
     * validate key bounded field for integer
     * @param $bound
     * @return bool
     */
    public function validateInteger($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_VALIDATE_INT) ? true : false;
    }

    /**
     * validate key bounded field for floting point values
     * @param $bound
     * @return bool
     */
    public function validateDecimal($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_VALIDATE_FLOAT) ? true : false;
    }

    /**
     * validate key bounded field for email address for misusing characters
     * @param $bound
     * @return bool
     */
    public function validateEmail($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_VALIDATE_EMAIL) ? true : false;
    }

    /**
     * sanitize bounded field for numbers
     * @param $bound
     * @return string
     */
    public function sanitizeNumber($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_SANITIZE_NUMBER_INT, array("flag" => FILTER_FLAG_EMPTY_STRING_NULL));
    }

    /**
     * sanitize bounded field for floating point values
     * @param $bound
     * @return string
     */
    public function sanitizeDecimal($bound)
    {
        setlocale(LC_ALL, "en_US.UTF-8");
        $data = $this->input_data[$bound];
        $options = array(
          "options" => array("decimal" => "."),
          "flags" => FILTER_FLAG_ALLOW_FRACTION
        );
        return filter_var($data, FILTER_SANITIZE_NUMBER_FLOAT, $options);
    }

    /**
     * sanitize bounded field for email address
     * @param $bound
     * @return string
     */
    public function sanitizeEmail($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_SANITIZE_EMAIL, array("flag" => FILTER_FLAG_EMPTY_STRING_NULL));
    }

    /**
     * sanitize bounded field for strings
     * @param $bound
     * @return string
     */
    public function sanitizeString($bound)
    {
        $data = $this->input_data[$bound];
        return filter_var($data, FILTER_SANITIZE_STRING,
          array("flag" => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_STRIP_BACKTICK | FILTER_FLAG_ENCODE_AMP | FILTER_FLAG_EMPTY_STRING_NULL));
    }

    /**
     * @param $key
     * @param $type
     * @return mixed
     * @throws Exception
     */
    public function getParameter($key, $type)
    {
        switch ($type) {
            case "s":
                {
                    return $this->sanitizeString($key);
                }
            case "i":
                {
                    if ($this->validateInteger($key)) {
                        return intval($this->sanitizeNumber($key));
                    }
                }
            case "d":
                {
                    if ($this->validateDecimal($key)) {
                        $res = $this->sanitizeDecimal($key);
                        return !is_null($res) ? doubleval($res) : 0.0;
                    }
                }
            case "e":
                {
                    if ($this->validateEmail($key)) {
                        $res = $this->sanitizeEmail($key);
                        return !is_null($res) ? $res : "a@b.com";
                    }
                }
            case "nn":
                {
                    return $this->input_data[$key];
                }

            default:
                {
                    throw new Exception("unidentified type or unauthorized data format detected");
                }
        }
    }

}

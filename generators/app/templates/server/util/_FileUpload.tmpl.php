<?php
namespace Util;
class FileUpload
{
    private $uploadlink;

    public function __construct($uploadlink)
    {
        $this->uploadlink = $uploadlink;
    }

    /**
     * @param $field_name string contains the field which carries the file resource
     * @return array
     *
     * @license private
     */
    public function uploadFile($field_name)
    {
        if (isset($_FILES[$field_name])) {
            $file = $_FILES[$field_name]['name'];
            $new_file_name = hash_hmac("sha256", "{$file}", "<%=file.salt%>");
            $extension = $this->extractExtension($file);
            $temporary = $_FILES[$field_name]['tmp_name'];
            $error = $_FILES[$field_name]['error'];

            $link = $this->uploadlink . $new_file_name . "." . $extension;
            if ($error > 0) {
                $response = array();
                $response['success'] = false;
                $response['error'] = $this->extractError($error);
                $response['file'] = null;
                return $response;
            } else {
                $response = array();
                if (move_uploaded_file($temporary, $link)) {
                    if (chmod($link, 0644)) {                         // remove execute file permissions from the file
                        $response['success'] = 'Persisted Successfully';
                        $response['error'] = false;
                        $response['file'] = $new_file_name . "." . $extension;
                        return $response;
                    } else {
                        $response['success'] = 'Uploaded Successfully';
                        $response['error'] = "cannot change the mode to 0644";
                        $response['file'] = $new_file_name . "." . $extension;
                    }
                } else {
                    $response['success'] = false;
                    $response['error'] = "File uploading Error";
                    $response['file'] = $new_file_name . "." . $extension;
                    return $response;
                }
            }
        }
    }

    /**
     * Extract Extension from uploaded file
     * @param $file
     * @return string the file extension
     */
    private function extractExtension($file)
    {
        return pathinfo($file, PATHINFO_EXTENSION);
    }

    /**
     * method for mapping numerical errors in file upload
     * for human readable errors
     * @param $error
     * @return string
     */
    private function extractError($error)
    {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
                {
                    return "Larger than upload_max_filesize :(";
                }
            case UPLOAD_ERR_FORM_SIZE:
                {
                    return "Larger than MAX_FILE_SIZE :(";
                }
            case UPLOAD_ERR_PARTIAL:
                {
                    return "Partial upload :(";
                }
            case UPLOAD_ERR_NO_FILE:
                {
                    return "No file :(";
                }
            case UPLOAD_ERR_NO_TMP_DIR:
                {
                    return "No temporary directory :(";
                }
            case UPLOAD_ERR_CANT_WRITE:
                {
                    return "Can't write to disk :(";
                }
            case UPLOAD_ERR_EXTENSION:
                {
                    return "File upload stopped by extension :(";
                }
            default:
                {
                    return "Unbounded error from SDK :(";
                }
        }
    }
}
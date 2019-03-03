<?php

/**
 * Upload a image file to local server using just a URL of the image on the remote server.
 * Upload methods include:
 * - cURL - Requires curl be installed
 * - file_get_contents() - Requires PHP.INI allow_url_fopen = true
 * - GD Library - fopen to get data and create image with GD library. Requires PHP.INI allow_url_fopen = true
 * - Socket Streams
 */
class UploadImage
{

    public $imageQuality;
    public $upload_method;
    public $remote_image_url;
    public $local_image_url;
    public $local_image_folder;
    public $allow_url_fopen = false;

    // not used, still considering using it to loop over and try methods when 1 fails
    public $upload_methods = array(
        'curl' => 'Upload using the cURL Extension if available.',
        'fopen' => 'Upload using file_get_contents() if PHP INI Setting allow_url_fopen is set to TRUE.',
        'gd' => 'Upload by re-creating image using the GD Image Processing Program',
        'sockets' => 'Upload image',
    );


    public function __construct($local_image_folder) // default method: cURL
    {
        $this->local_image_folder = $local_image_folder;
        $this->canUseRemoteUrlFopen();
    }

    public function canUseRemoteUrlFopen(){
        if(ini_get('allow_url_fopen')){
            $this->allow_url_fopen = true;
        }
    }

    /**
     * Upload a Remote image by supplying a URL of remote image.  Upload method can be set
     * manually oherwise it will try to auto-detect which methods are available on a per server basis!
     * @param  string $remote_image_url URL to the remote server image
     * @param  string $upload_method  Optional.  PHP method used to upload image.
     * [curl, gd, fopen, sockets]
     * $upload_method = 'curl, gd, fopen, sockets'
     * @return
     */
    function uploadRemoteImage($remote_image_url, $upload_method = '') // default method: cURL
    {
        $this->remote_image_url = $remote_image_url;
        $info = @GetImageSize($this->remote_image_url);
        $mime = $info['mime'];

        // What sort of image?
        $type = substr(strrchr($mime, '/'), 1);

        switch ($type) {
            case 'jpeg':
                $image_create_func = 'ImageCreateFromJPEG';
                $image_save_func = 'ImageJPEG';
                $new_image_ext = 'jpg';

                // Best Quality: 100
                $imageQuality = isset($this->imageQuality) ? $this->imageQuality : 100;
                break;

            case 'png':
                $image_create_func = 'ImageCreateFromPNG';
                $image_save_func = 'ImagePNG';
                $new_image_ext = 'png';

                // Compression Level: from 0  (no compression) to 9
                $imageQuality = isset($this->imageQuality) ? $this->imageQuality : 0;
                break;

            case 'bmp':
                $image_create_func = 'ImageCreateFromBMP';
                $image_save_func = 'ImageBMP';
                $new_image_ext = 'bmp';
                break;

            case 'gif':
                $image_create_func = 'ImageCreateFromGIF';
                $image_save_func = 'ImageGIF';
                $new_image_ext = 'gif';
                break;

            case 'vnd.wap.wbmp':
                $image_create_func = 'ImageCreateFromWBMP';
                $image_save_func = 'ImageWBMP';
                $new_image_ext = 'bmp';
                break;

            case 'xbm':
                $image_create_func = 'ImageCreateFromXBM';
                $image_save_func = 'ImageXBM';
                $new_image_ext = 'xbm';
                break;

            default:

                die('Not a valid image type');

                $image_create_func = 'ImageCreateFromJPEG';
                $image_save_func = 'ImageJPEG';
                $new_image_ext = 'jpg';
        }

        $timestamp = time();

        $ext = strrchr($this->remote_image_url, ".");
        $strlen = strlen($ext);

        $new_name = basename(substr($this->remote_image_url, 0, -$strlen)) . '-' . $timestamp .
            '.' . $new_image_ext;

        // local file path + new filename
        $save_to = $this->local_image_folder.'/'.$new_name;


        // Upload using defined Upload Method, otherwise try all of them until we get one that might work
        if(isset($upload_method) && $upload_method != ''){
            $this->upload_method = $upload_method;
        }else{

            // check if CURL is installed
            if (function_exists('curl_init')){
                $this->upload_method = 'curl';
                // Check if PHP allows file_get_contents to use URL instead of file paths
            }elseif($this->allow_url_fopen){
                $this->upload_method = 'fopen';
                // Try GD library also requires PHP INI allow_url_fopen = true
            }elseif (extension_loaded('gd') && function_exists('gd_info') && $this->allow_url_fopen) {
                $this->upload_method = 'gd';
                // Try Sockets
            }else{
                $this->upload_method = 'sockets';
            }
        }

        switch ($this->upload_method) {
            case 'curl':
                $save_image = $this->curl_fetch_image($save_to);
                break;

            case 'fopen':
                $save_image = $this->fopen_fetch_image($save_to);
                break;

            case 'gd':
                $img = $image_create_func($this->remote_image_url);

                if (isset($imageQuality)) {
                    $save_image = $image_save_func($img, $save_to, $imageQuality);
                } else {
                    $save_image = $image_save_func($img, $save_to);
                }
                $save_image = $save_to;
                break;

            case 'sockets':
                $save_image = $this->sockets_fetch_image($save_to);
                break;
            default:
                $save_image = 'ERROR';
        }

        return $save_image;
    }


    public function curl_fetch_image($save_to)
    {
        $ch = curl_init($this->remote_image_url);
        $fp = fopen($save_to, "wb");

        // set URL and other appropriate options
        $options = array(
            CURLOPT_FILE => $fp,
            CURLOPT_HEADER => 0,
            CURLOPT_FOLLOWLOCATION => 1,
            CURLOPT_TIMEOUT => 60); // 1 minute timeout (should be enough)

        curl_setopt_array($ch, $options);

        $curl_result = curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        if($curl_result){
            return $save_to;
        }else{
            die('ERROR Saving Remote File using cURL');
        }

    }


    public function fopen_fetch_image($save_to) {
        $image_to_fetch = file_get_contents($this->remote_image_url, false, NULL);
        //file_put_contents($save_to, $image_to_fetch);

        $local_image_file = fopen($save_to, 'w+');
        chmod($save_to, 0755);
        $imageFIle = fwrite($local_image_file, $image_to_fetch);
        fclose($local_image_file);

        if($imageFIle){
            return $save_to;
        }else{
            die('ERROR Saving Remote File using file_get_contents()');
        }


    }


    /**
     * [sockets_fetch_image description]
     * @param  [type] $save_to [description]
     * @return [type]          [description]
     */
    public function sockets_fetch_image($save_to)
    {
        $remoteImageResource = fopen($this->remote_image_url, 'r');
        $localImageResource = fopen($save_to, 'w+');
        stream_copy_to_stream($remoteImageResource, $localImageResource);

        fclose($remoteImageResource);
        fclose($localImageResource);

        return $save_to;
    }

}
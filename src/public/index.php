<?php
use Slim\Http\Request;
use Slim\Http\Response;
use Stichoza\GoogleTranslate\GoogleTranslate;
use Buchin\GoogleImageGrabber\GoogleImageGrabber;
use \Gumlet\ImageResize;

require '../vendor/autoload.php';
require 'UploadImage.php';

$config['displayErrorDetails'] = true;
$config['addContentLengthHeader'] = false;

$config['db'] = [
    'driver' => 'mysql',
    'host' => 'localhost',
    'database' => 'vextrus',
    'username' => 'root',
    'password' => '',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
];

$app = new \Slim\App(['settings' => $config]);

$container = $app->getContainer();

$container['view'] = function () {
    $loader = new \Symfony\Component\Templating\Loader\FilesystemLoader(
        [
           '../templates/%name%'
        ]
    );

    $templating = new \Symfony\Component\Templating\PhpEngine(new \Symfony\Component\Templating\TemplateNameParser(), $loader);
    $templating->set(new \Symfony\Component\Templating\Helper\SlotsHelper());

    return $templating;
};

//$container['db'] = function ($c) {
//    $db = $c['settings']['db'];
//    $pdo = new PDO("mysql:host=" . $db['host'] . ";dbname=" . $db['dbname'],
//        $db['user'], $db['pass']);
//    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
//    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
//    return $pdo;
//};

// Service factory for the ORM
$container['db'] = function ($container) {
    $capsule = new \Illuminate\Database\Capsule\Manager;
    $capsule->addConnection($container['settings']['db']);

    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    return $capsule;
};

$app->get('/', function (Request $request, Response $response) {
    $response = $this->view->render("/views/first.phtml", [
        'jsFunction' => '',
    ]);
    return $response;
});

$app->get('/level1', function (Request $request, Response $response) {
    $words = $this->db->table('words')->get();

    $response = $this->view->render("/views/level1.phtml", [
        'words' => $words
    ]);

    return $response;
});

$app->get('/level2', function (Request $request, Response $response) {
    $wordsLt = $this->db->table('words')->inRandomOrder()->get();
    $wordsRu = $this->db->table('words')->inRandomOrder()->get();

    $response = $this->view->render("/views/level2.phtml", [
        'jsFunction' => 'level2();',
        'wordsLt' => $wordsLt,
        'wordsRu' => $wordsRu
    ]);
    return $response;
});

$app->get('/level3', function (Request $request, Response $response) {
    $words = $this->db->table('words')->get();
    $wordsOptions = $this->db->table('words')->inRandomOrder()->get();

    $response = $this->view->render("/views/level3.phtml", [
        'jsFunction' => 'level3();',
        'words' => $words,
        'wordsOptions' => $wordsOptions,
    ]);
    return $response;
});

$app->any('/login', function (Request $request, Response $response) {

    if ($request->getParam('password') && $request->getParam('password') == '6545') {
        return $response->withRedirect('admin');
    }

    $response = $this->view->render("/views/login.phtml", []);
    return $response;
});

$app->get('/admin', function (Request $request, Response $response) {
    $words = $this->db->table('words')->get();

    $response = $this->view->render("/views/admin.phtml", [
        'words' => $words
    ]);
    return $response;
});

$app->post('/admin/remove', function (Request $request, Response $response) {
    $id = $request->getParam('id');
    $words = $this->db->table('words')->where('id', $id)->get();

    foreach ($words as $word) {
        $imagePath = 'data/img/' . $word->image;
        $audioLtPath = 'data/media/' . $word->audio_original;
        $audioRuPath = 'data/media/' . $word->audio_translation;

        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        if (file_exists($audioLtPath)) {
            unlink($audioLtPath);
        }

        if (file_exists($audioRuPath)) {
            unlink($audioRuPath);
        }
    }

    $this->db->table('words')->where('id', $id)->delete();
});

$app->get('/admin/add', function (Request $request, Response $response) {
    $response = $this->view->render("/views/add.phtml", []);
    return $response;
});

$app->get('/translate', function (Request $request, Response $response) {
    $tr = new GoogleTranslate();
    $tr->setSource('lt');
    $tr->setTarget('ru');

    if ($request->getParam('phrase')) {
        return $tr->translate($request->getParam('phrase'));
    }
});

$app->get('/google-images', function (Request $request, Response $response) {
    if ($request->getParam('phrase')) {
        $images = [];
        $result = GoogleImageGrabber::grab($request->getParam('phrase'));

        if ($result) {
            $sliced = array_slice($result, rand(0, 30), 4);

            foreach ($sliced as $item) {
                $images[] = $item;
            }
        }

        return json_encode($images);
    }
});

$app->post('/upload-audio', function (Request $request, Response $response) {
    $input = $_FILES['audio_data']['tmp_name'];
    $filename = $_FILES['audio_data']['name'].".webm";
    $output = 'data/media/' . $filename;
    move_uploaded_file($input, $output);
});

$app->post('/submit-data', function (Request $request, Response $response) {
    $data = $request->getParams();
    $directory = 'data/img/';
    $filename = $data['filename']. '.jpg';

    // Image
    // You can set the prefered upload method.
    // If you do not set it, then it will try all of them until it can use one!
    //$upload_method = 'curl';
    //$upload_method = 'gd';
    //$upload_method = 'fopen';
    //$upload_method = 'sockets';
    $upload_method = '';

    // initialize the class
    $imageUpload = new UploadImage($directory);
    $getImage = $imageUpload->uploadRemoteImage($data['image'], $upload_method);

    $image = new ImageResize($getImage);
    $image->resizeToBestFit(300, 200);
    $image->save($directory . $filename);

    if (file_exists($getImage)) {
        unlink($getImage);
    }

    $this->db->table('words')
        ->insert(
            [
                'original' => (!empty($data['original']) ? $data['original'] : ''),
                'transcription' => (!empty($data['transcription']) ? $data['transcription'] : ''),
                'translation' => (!empty($data['translation']) ? $data['translation'] : ''),
                'image' => (!empty($data['image']) ? $filename : ''),
                'audio_original' => (!empty($data['filename_lt']) ? $data['filename_lt'] . '.webm' : ''),
                'audio_translation' => (!empty($data['filename_ru']) ? $data['filename_ru'] . '.webm' : '')
            ]
        );
});

$app->run();
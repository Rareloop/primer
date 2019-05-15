<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Exception;
use Psr\Http\Message\ResponseInterface;
use Zend\Diactoros\Response;

class AssetsController
{
    public function stylesheet($file)
    {
        return $this->createResponse('css/' . $file, 'text/css');
    }

    public function javascript($file)
    {
        return $this->createResponse('js/' . $file, 'application/javascript');
    }

    public function image($file)
    {
        return $this->createResponse('img/' . $file);
    }

    protected function createResponse($file, $mimeType = null) : ResponseInterface
    {
        try {
            $stream = $this->getFileStream($file);
        } catch (Exception $e) {
            return new Error404Response;
        }

        $path = $this->getFilePath($file);

        return new Response($stream, 200, [
            'Content-Type' => $mimeType ?? $this->getMimeTypeOfFile($file),
            'Last-Modified' => date('r', filemtime($path)),
            'Etag' => md5_file($path),
        ]);
    }

    protected function getFileStream($file)
    {
        $path = $this->getFilePath($file);

        if (!file_exists($path)) {
            throw new Exception;
        }

        return fopen($path, 'r+');
    }

    protected function getMimeTypeOfFile($file)
    {
        $path = $this->getFilePath($file);

        return mime_content_type($path);
    }

    protected function getFilePath($file)
    {
        return __DIR__ . '/../../vendor/rareloop/primer-frontend/frontend/dist/' . $file;
    }
}

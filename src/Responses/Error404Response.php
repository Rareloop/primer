<?php

namespace App\Responses;

use Zend\Diactoros\Response\HtmlResponse;

class Error404Response extends HtmlResponse
{
    public function __construct($content = '<p>Not found</p>')
    {
        return parent::__construct($content, 404);
    }
}

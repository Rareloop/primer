<?php

namespace App\Responses;

use Zend\Diactoros\Response\HtmlResponse;

class Error500Response extends HtmlResponse
{
    public function __construct($content = '<p>Unexpected Error</p>')
    {
        return parent::__construct($content, 500);
    }
}

<?php

namespace App\Responses;

use Zend\Diactoros\Response\HtmlResponse;

class Error404Response extends HtmlResponse
{
    public function __construct()
    {
        return parent::__construct('<p>Not found</p>', 404);
    }
}

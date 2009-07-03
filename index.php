<?php

$default = 'en';

if (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) || $_SERVER['HTTP_ACCEPT_LANGUAGE'] === '') {
	redirect($default . '/', 302);
}

$L = array();
$Q = array();
foreach (explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']) as $v) {
	$v = trim($v);
	$p = strpos($v, ';', 2);
	if ($p !== false) {
		$l = strtolower(substr($v, 0, $p));
		$q = floatval(substr($v, $p+3));
	} else {
		$l = strtolower($v);
		$q = 1;
	}
	if ($q === 1) {
		//short cut
		if (is_dir($l)) {
			redirect($l . '/', 302);
		}
	}
	if (is_dir($l)) {
		$Q[] = $q;
		$L[] = $l;
	}
}
array_multisort(
	$Q, SORT_DESC, SORT_NUMERIC,
	$L, SORT_ASC, SORT_STRING
);
if (count($L) === 0) {
        redirect($default . '/', 302);
} elseif ($Q[0] === $Q[1]) {
        redirect($default . '/', 300);
} else {
        redirect($L[0] . '/', 302);
}

function redirect($path, $code) {
	switch ($code) {
		case 300:
			header($_SERVER['SERVER_PROTOCOL'] . ' 300 Multiple Choices');
			break;
		case 301:
			header($_SERVER['SERVER_PROTOCOL'] . ' 301 Moved Permanently');
			break;
		case 302:
			header($_SERVER['SERVER_PROTOCOL'] . ' 302 Found');
			break;
	}
	header('Location: http://' . $_SERVER['SERVER_NAME'] . $_SERVER["REQUEST_URI"] . $path);
	exit();
}

?>

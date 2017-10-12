<!doctype html>
<?php

?>
<html>
    <head>
    	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Phaser Examples - tilemaps/csv_map.js</title>
		<script type="text/javascript" src="crypto-js/core.js"></script>
		<script type="text/javascript" src="crypto-js/cipher-core.js"></script>
		<script type="text/javascript" src="crypto-js/hmac.js"></script>
		<script type="text/javascript" src="crypto-js/md5.js"></script>
		<script type="text/javascript" src="crypto-js/aes.js"></script>
		<script type="text/javascript" src="crypto-js/enc-base64.js"></script>
		<script type="text/javascript" src="crypto-js/enc-utf16.js"></script>
		<script type="text/javascript" src="wsconnect.js"></script>
		<script type="text/javascript" src="jcrypt.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser-ce/2.9.1/phaser.min.js" type="text/javascript"></script>
	</head>
	<body>
		<div id="gameDiv" pseudo="<?=$_POST['pseudo'];?>" pass="<?=$_POST['pass'];?>">
		</div>
	</body>
	<script src="client/player.js"></script>
	<script src="client/main.js"></script>
</html>

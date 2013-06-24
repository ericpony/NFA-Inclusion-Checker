<script src='timbuk_to_aag.js'></script>
<table style='margin:auto'>
<tr><th>Timbuk <th>AIG <th>Log
<tr><td>
	<table>
<!--	<tr><td><center>NFA A</center>-->
	<tr><td>
	<textarea style='width:300px; height:247px;' id='aut1'>
<? readfile('aut1'); ?>
	</textarea>
<!--	<tr><td><center>NFA B</center>-->
	<tr><td>
	<textarea style='width:300px; height:247px;' id='aut2'>
<? readfile('aut2'); ?>
	</textarea>
	</table>
<td>
<textarea style='width:300px; height:500px;' id='aag'>
</textarea>
<td>
<textarea style='height:100%; width:600px;' id='console'>
</textarea>
<tr><td colspan='3'>
<button onclick='main()' style='width:100%;height:50px;font-size:1.3em'>Property is proven if L(A1) is contained in L(A2)</button>
<tr><td colspan='2'>
</table>
<script type='text/javascript' src='/share/style/jquery-1.4.2.js'></script>
<script>
function print(line){
	document.getElementById('aag').value += (line?line:'') + "\n";
}
function log(line){
	document.getElementById('console').value += (line?line:'') + "\n";
}
function reset(){
	document.getElementById('aag').value = '';
	document.getElementById('console').value = '';
}
function main(){ 
	reset(); 
	timbuk_to_aag.run(); 
	$.post('main.php',{aag:document.getElementById('aag').value.replace(/\n\n+|\n$/g,'')},function(x){log(x.replace(/ABC.*/,''))});
}
main();
</script>

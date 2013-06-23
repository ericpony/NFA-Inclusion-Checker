<?
passthru('echo '.escapeshellarg($_POST['aag']).' > test.aag ; aiger-1.9.4/aigtoaig test.aag test.aig ; abc/abc -c "read test.aig; pdr"');
?>

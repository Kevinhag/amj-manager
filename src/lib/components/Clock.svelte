<script>
	import { onMount } from "svelte";

	let td = new Date();

	onMount(() => {
		const interval = setInterval(() => {
			td = new Date();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Formatar a data e hora em português
	$: TimeDate = `${td.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: '2-digit', year: '2-digit' })}`;
	$: Time = `${td.toLocaleTimeString('pt-BR')}`;
</script>

<div>
	<p>{TimeDate}</p>
	<p>{Time}</p>
</div>

<style>    
	p {
		font-weight: 300;
		font-family: 'Titillium Web', sans-serif;
		font-size: 1.1em;
		padding: 0;
		margin: 0;
	}
</style>

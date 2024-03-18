<script>
	import { onMount } from "svelte";

	let td = new Date();

	onMount(() => {
		const interval = setInterval(() => {
			td = new Date();
		}, 1000);

		return () => clearInterval(interval);
	});

    $: TimeDate = `${td.toDateString()} - ${td.toLocaleTimeString()}`;
</script>

<div>
    <p>{TimeDate}</p>
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
<script>
	import { browser } from '$app/environment';

	let desktop;

	if (window.electron && browser) {
		window.electron.receive('from-main', function (data) {
			desktop = `Received Message "${data}" from Electron`;
			console.log(desktop);
		});
	}

	const agent = window.electron ? 'Electron' : 'Browser';
</script>

<main>

	<h1>Hello {agent}!</h1>

	{#if desktop}
		<br />
		<br />
		{desktop}
	{/if}
</main>

<style lang="scss">

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>

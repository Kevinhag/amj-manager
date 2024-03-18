<script>
	import Counter from '$lib/Counter.svelte';
	import Logo from '$lib/Logo.svelte';
	import { browser } from '$app/environment';
	import AddPart from '$lib/AddPart.svelte';

	let desktop;
	let showPartsPopup = false;

	if (window.electron && browser) {
		window.electron.receive('from-main', function (data) {
			desktop = `Received Message "${data}" from Electron`;
			console.log(desktop);
		});
	}

	const agent = window.electron ? 'Electron' : 'Browser';

	function openPartsPopup() {
		showPartsPopup = true;
	}

	function closePartsPopup() {
		showPartsPopup = false;
	}

</script>

{#if showPartsPopup}
	<div class="parts-popup">
		<AddPart />
		<button on:click={closePartsPopup}>Fechar</button>
	</div>
{/if}

<div class="main-selector">
	<a href="/consult" class="selector-box consulta-cliente">Consultar Cliente</a>
	<a href="/clients" class="selector-box add-client">Adicionar Cliente</a>
	<option on:click={openPartsPopup} class="selector-box add-parts">Adicionar Peças</option>
	<a href="/report" class="selector-box report">Relatórios</a>
</div>

<style lang="scss">
	.main-selector {
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		// background-color: violet;
		gap: 20px;
		width: 100%;
		height: 100%;
	}

	.selector-box {
		display: grid;
		place-items: center;
		border-radius: 10px;
		// background-color: #8a2be244;
		min-height: 400px;
		min-width: 150px;
		height: 90%;
		width: 20%;
		transition: 0.25s;
		cursor: pointer;
		border: 1px solid #8a2be2;
		position: relative;

		&:hover {
			background-color: #8a2be2;
			scale: 103%;
		}
	}


	.report {
		background-color: $color2a;
		border: 1px solid $color2;
		&:hover {
			background-color: $color2;
		}
	}

	.add-client {
		background-color: $color2a;
		border: 1px solid $color2;
		&:hover {
			background-color: $color2;
		}
	}
	
	.parts-popup{
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		padding: 20px;
		border: 1px solid $color;
		border-radius: 10px;
		button{
			width: 200px;
		}

	}
	.add-parts {
		&::before {
			position: absolute;
			width: 100%;
			height: 100%;
			content: '';
			border-radius: 10px;
			background-size: cover;
			background-image: url('../assets/parts_bg.jpg');
			opacity: 0.5;
		}
	}
</style>

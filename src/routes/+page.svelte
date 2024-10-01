<script>
	import { browser } from '$app/environment';
	import AddPart from '$lib/components/AddCar.svelte';

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
	<a href="/clients" class="selector-box add-client"> </a>
	<a href="/os" class="selector-box os"> </a>
	<!-- <option on:click={openPartsPopup} class="selector-box add-parts">Adicionar Peças</option> -->
	<a href="/parts" class="selector-box add-parts"> </a>
	<a href="/report" class="selector-box report"> </a>
</div>

<style lang="scss">
	// @import '../lib/styles/global.scss';
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
		position: relative;
		overflow: hidden;
		display: grid;
		place-items: center;
		border-radius: 10px;
		min-height: 400px;
		min-width: 150px;
		height: 90%;
		width: 20%;
		transition: 0.25s;
		cursor: pointer;
		border: 1px solid $color2;
		position: relative;

		&:hover {
			background-color: $color2;
			scale: 103%;
		}
	}

	.parts-popup {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		padding: 20px;
		border: 1px solid $color;
		border-radius: 10px;
		button {
			width: 200px;
		}
	}
	.add-parts {
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			content: '';
			border-radius: 10px;
			background-size: cover;
			background-image: url('../assets/parts_bg.jpg');
			opacity: 0.5;
			transition: opacity 0.25s ease; /* Transição suave para a opacidade */
		}

		&::after {
			position: absolute;
			align-items: center;
			width: 100%;
			height: 0;
			content: 'PEÇAS / SERVIÇOS';
			font-size: 20pt;
			font: 700 20pt 'Roboto Condensed', Arial, sans-serif;
			background-color: #00000055;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			transition: height 0.25s ease;
		}

		&:hover {
			background-color: $color2;

			&::after {
				height: 30%;
			}
		}
	}

	.os {
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			content: '';
			border-radius: 10px;
			background-size: cover;
			background-image: url('../assets/os_bg.webp');
			opacity: 0.5;
			transition: opacity 0.25s ease; /* Transição suave para a opacidade */
		}

		&::after {
			position: absolute;
			align-items: center;
			width: 100%;
			height: 0; /* Altura inicial é 0 */
			content: 'CRIAR OS';
			font-size: 20pt;
			font: 700 20pt 'Roboto Condensed', Arial, sans-serif;
			background-color: #00000055;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			transition: height 0.25s ease; /* Transição suave para a altura */
		}

		&:hover {
			background-color: $color2;

			&::after {
				height: 30%; /* Aumenta a altura no estado de hover */
			}
		}
	}

	.add-client {
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			content: '';
			border-radius: 10px;
			background-size: cover;
			background-image: url('../assets/client_bg.webp');
			background-position: center;
			opacity: 0.5;
			transition: opacity 0.25s ease;
		}

		&::after {
			position: absolute;
			align-items: center;
			width: 100%;
			height: 0;
			content: 'CLIENTES';
			font-size: 20pt;
			font: 700 20pt 'Roboto Condensed', Arial, sans-serif;
			background-color: #00000055;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			transition: height 0.25s ease;
		}

		&:hover {
			background-color: $color2;

			&::after {
				height: 30%;
			}
		}
	}

	.report {
		&::before {
			position: absolute;
			width: 100%;
			height: 100%;
			content: '';
			border-radius: 10px;
			background-size: cover;
			background-image: url('../assets/report_bg.webp');
			opacity: 0.5;
		}

		&::after {
			position: absolute;
			align-items: center;
			width: 100%;
			height: 0;
			content: 'RELATÓRIOS';
			font-size: 20pt;
			font: 700 20pt 'Roboto Condensed', Arial, sans-serif;
			background-color: #00000055;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			transition: height 0.25s ease;
		}
		&:hover {
			background-color: $color2;

			&::after {
				height: 30%;
			}
		}
		/* 		&.disabled {
			pointer-events: none;
			opacity: 0.5;
			border: 1px solid grey;
		} */
	}
</style>

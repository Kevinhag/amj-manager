<script>
	import { onMount } from 'svelte';

	let cars = [];
	let selectedCar = '';
	let selectedCarData = '';

	onMount(() => {
		fetch('http://localhost:3000/api/cars')
			.then((response) => response.json())
			.then((data) => {
				cars = data;
				console.log(data);
			});
	});

	$: selectedCarData = cars.find((car) => car.id == selectedCar);

	// $: console.log('Selected Part:', selectedCar);
	// $: console.log('Selected Part Data:', selectedCarData);
</script>

<section>
	<div class="title">
		<div>
			<h2>Adicionar Peça</h2>
		</div>
		<div>
			<h2>Lista de Carros</h2>
		</div>
	</div>
	<div class="main">
		<div class="part-add">
			<div class="form-part">
				<label for="name">Nome</label>
				{#if selectedCarData != null}
					<input type="text" id="name" bind:value={selectedCarData.modelo} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-part">
				<label for="brand">Marca</label>
				{#if selectedCarData != null}
					<input type="text" id="brand" bind:value={selectedCarData.marca} />
				{:else}
					<input type="text" id="brand" />
				{/if}
			</div>
			<div>
				{#if selectedCarData != null}
					<button type="submit">Alterar Peça</button>
				{:else}
					<button type="submit">Adicionar Peça</button>
				{/if}
				{#if selectedCarData != null}
					<button on:click={() => (selectedCarData = null)}>Nova Peça</button>
				{:else}
					<button disabled>Nova Peça</button>
				{/if}
			</div>
		</div>

		<div class="cars-list">
			<select name="cars" id="cars" size="10" bind:value={selectedCar}>
				{#each cars as car (car.id)}
					<option value={car.id}>
						{car.marca + '\xa0'.repeat(15 - (car.marca.length)) + '\xa0'.repeat(5) + car.modelo + '\xa0'.repeat(15 - car.modelo.length) +car.placa + '\xa0'.repeat(15 - (car.marca.length))}
					</option>
				{/each}
			</select>
		</div>
	</div>
</section>

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		justify-content: center;
		align-items: center;

		.title {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
			gap: 20px;
			> * {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
				width: 100%;
				padding: 10px;
			}
		}
		.main {
			display: grid;

			grid-template-columns: 1fr 1fr;
			justify-content: space-evenly;
			gap: 20px;
			align-items: end;
			width: 100%;
			> * {
				width: 100%;
				height: 100%;
			}

			.part-list {
                
				display: flex;
				flex-direction: column;
				justify-content: center;
				// background-color: #44444433;
				// width: 100%;
				// height: 100%;
				// gap: 10px;
				// padding: 20px;
				border: 1px solid $bgtestg;
				border-radius: $radius;
                select{
                    font: 700 14px "Roboto Mono", Arial, sans-serif;
                }
			}
			.part-add {
				display: flex;
				flex-direction: column;
				justify-content: center;
				background-color: #44444433;
				width: 100%;
				height: 100%;
				gap: 10px;
				padding: 20px;
				border: 1px solid $bgtestg;
				border-radius: 10px;
			}
		}
	}
</style>

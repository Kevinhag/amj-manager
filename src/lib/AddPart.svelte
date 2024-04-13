<script>
	import { onMount } from 'svelte';

	let parts = [];
	let selectedPart = '';
	let selectedPartData = '';

	onMount(() => {
		fetch('http://localhost:3000/api/parts')
			.then((response) => response.json())
			.then((data) => {
				parts = data;
				console.log(data);
			});
	});

	function addPart() {
		const newPart = {
			nome: name,
			marca: brand,
		};

		fetch('http://localhost:3000/api/parts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newPart),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Part added:', data);
				parts = [...parts, data];
				selectedPartData = null;
				selectedPart = '';
				alert('Peça adicionada com sucesso!');
			})
			.catch((error) => {
				console.error('Error adding part:', error);
			});
	}

	function updatePart() {
		const updatedPart = {
			id: selectedPartData.id,
			nome: selectedPartData.nome,
			marca: selectedPartData.marca,
		};

		fetch(`http://localhost:3000/api/parts/${selectedPartData.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updatedPart),
		})
			.then((response) => response.json())
			.then((data) => {
				parts = parts.map((part) => (part.id == selectedPartData.id ? updatedPart : part));
				console.log('Part updated:', data);
				selectedPartData = null;
				selectedPart = '';
				alert('Peça alterada com sucesso!');
			})
			.catch((error) => {
				console.error('Error updating part:', error);
			});
	}

	function deletePart() {
		fetch(`http://localhost:3000/api/parts/${selectedPartData.id}`, {
			method: 'DELETE',
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Part deleted:', data);
				parts = parts.filter((part) => part.id != selectedPartData.id);
				selectedPartData = null;
				selectedPart = '';
				alert('Peça excluída com sucesso!');
			})
			.catch((error) => {
				console.error('Error deleting part:', error);
			});
	}

	$: selectedPartData = parts.find((part) => part.id == selectedPart);
</script>

<section>
	<div class="title">
		<div>
			<h2>Adicionar Peça</h2>
		</div>
		<div>
			<h2>Lista de Peças</h2>
		</div>
	</div>
	<div class="main">
		<div class="part-add">
			<div class="form-part">
				<label for="name">Nome</label>
				{#if selectedPartData != null}
					<input type="text" id="name" bind:value={selectedPartData.nome} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-part">
				<label for="brand">Marca</label>
				{#if selectedPartData != null}
					<input type="text" id="brand" bind:value={selectedPartData.marca} />
				{:else}
					<input type="text" id="brand" />
				{/if}
			</div>
			<div>
				{#if selectedPartData != null}
					<button type="submit" on:click={updatePart}>Alterar Peça</button>
				{:else}
					<button type="submit" on:click={addPart}>Adicionar Peça</button>
				{/if}
				{#if selectedPartData != null}
					<button on:click={deletePart}>Excluir Peça</button>
				{:else}
					<button disabled>Excluir Peça</button>
				{/if}
				{#if selectedPartData != null}
					<button on:click={() => (selectedPartData = null)}>Nova Peça</button>
				{:else}
					<button disabled>Nova Peça</button>
				{/if}
			</div>
		</div>

		<div class="part-list">
			<select name="parts" id="parts" size="10" bind:value={selectedPart}>
				{#each parts as part (part.id)}
					<option value={part.id}>
						{part.marca}&nbsp;&nbsp; - &nbsp;&nbsp;{part.nome}
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
				border: 1px solid $bgtestg;
				border-radius: $radius;
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

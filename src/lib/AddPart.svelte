<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/Notification.svelte'; // Importe o componente de notificação

	let parts = [];
	let selectedPart = '';
	let selectedPartData = '';
	let name = '';
	let brand = '';
	let notificationMessage = '';
	let notificationType = '';

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

		fetch('http://localhost:3000/api/insert-part', {
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
				name = ''; // Clear input fields
				brand = ''; // Clear input fields
				showNotification('Peça adicionada com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Error adding part:', error);
				showNotification('Erro ao adicionar peça', 'error');
			});
	}

	function updatePart() {
		const updatedPart = {
			id: selectedPartData.id,
			nome: selectedPartData.nome,
			marca: selectedPartData.marca,
		};

		fetch('http://localhost:3000/api/update-parts', {
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
				showNotification('Peça alterada com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Error updating part:', error);
				showNotification('Erro ao alterar peça', 'error');
			});
	}

	function deletePart(selectedPartData) {
		fetch(`http://localhost:3000/api/delete-part/${selectedPartData.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((response) => response.json())
			.then((data) => {
				parts = parts.filter((part) => part.id !== selectedPartData.id);
				console.log('Part deleted:', data);
				showNotification('Peça deletada com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Error deleting part:', error);
				showNotification('Erro ao deletar peça', 'error');
			});
	}

	function showNotification(message, type) {
		notificationMessage = message;
		notificationType = type;
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
					<input type="text" id="name" bind:value={name} />
				{/if}
			</div>
			<div class="form-part">
				<label for="brand">Marca</label>
				{#if selectedPartData != null}
					<input type="text" id="brand" bind:value={selectedPartData.marca} />
				{:else}
					<input type="text" id="brand" bind:value={brand} />
				{/if}
			</div>
			<div>
				{#if selectedPartData != null}
					<button type="button" on:click={updatePart}>Alterar Peça</button>
				{:else}
					<button type="button" on:click={addPart}>Adicionar Peça</button>
				{/if}
				{#if selectedPartData != null}
					<button type="button" on:click={() => deletePart(selectedPartData)}>
						Excluir Peça
					</button>
				{:else}
					<button type="button" disabled>Excluir Peça</button>
				{/if}
				{#if selectedPartData != null}
					<button type="button" on:click={() => (selectedPartData = null)}>
						Nova Peça
					</button>
				{:else}
					<button type="button" disabled>Nova Peça</button>
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

	{#if notificationMessage}
		<Notification message={notificationMessage} type={notificationType} />
	{/if}
</section>

<style lang="scss">

	input {
		color: $maintextcolor;
		width: 100%;
		padding: 5px;
		border-radius: 5px;
		border: 1px solid #cccccc33;
	}
	
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
			height: 80px;
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
			height: 100%;
			> * {
				width: 100%;
				height: 100%;
			}

			.part-list {
				display: flex;
				flex-direction: column;
				justify-content: center;
				height: 100%;
				border: 1px solid #cccccc33;
				background-color: #44444433;
				border-radius: $radius;
				select {
					height: 100%;
					font: 700 14px 'Roboto Mono', Arial, sans-serif;
				}
			}
			.part-add {
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: #44444433;
				flex-wrap: wrap;
				width: 100%;
				height: 100%;
				gap: 10px;
				padding: 20px;
				border: 1px solid #cccccc33;
				border-radius: 10px;

				.form-part {
					width: 40%;
					display: flex;
					flex-direction: column;
					gap: 5px;
					label {
						color: $maintextcolor;
					}
					input {
						font: 700 14px 'Roboto Mono', Arial, sans-serif;
						padding: 5px;
						border-radius: 5px;
						border: 1px solid #cccccc33;
					}
				}
			}
		}
	}
</style>

<script>
	let showPartsPopup = false;

	function openPartsPopup() {
		showPartsPopup = true;
	}

	function closePartsPopup() {
		showPartsPopup = false;
	}
</script>

{#if showPartsPopup}
	<div class="parts-popup">
		<!-- Content of the Parts popup goes here -->
		<!-- You can use a separate component or HTML markup -->
		<button on:click={closePartsPopup}>Close</button>
	</div>
{/if}
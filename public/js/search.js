const searchInput = document.getElementById("searchInput");
const courseCards = document.querySelectorAll(".course-card");

searchInput.addEventListener("keyup", function () {
  const query = searchInput.value.toLowerCase();

  courseCards.forEach(function (card) {
    const title = card.querySelector(".font-bold").textContent.toLowerCase();
    const educator = card
      .querySelector(".font-semibold")
      .textContent.toLowerCase();

    if (title.includes(query) || educator.includes(query)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
});

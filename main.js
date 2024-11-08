// Get elements
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

// Toggle the menu and hamburger icon
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  menu.classList.toggle("active");
});

const background = [
  "blue.jpg",
  "orange.jpg",
  "red.jpg",
  "teal.jpg",
  "yellow.jpg",
];

const chooseBackground = () => {
  const randomIndex = Math.floor(Math.random() * background.length);
  const randomBackground = background[randomIndex];

  document.body.style.backgroundImage = `url('backgrounds/${randomBackground}')`;
};

chooseBackground();

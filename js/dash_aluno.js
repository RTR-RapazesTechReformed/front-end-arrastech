document.addEventListener("DOMContentLoaded", async function () {
  const notificationsIcon = document.querySelector(".notifications");
  const notificationsDropdown = document.querySelector(
    ".notifications-dropdown"
  );
  const userProfile = document.querySelector(".user-profile");
  const userDetails = document.querySelector(".user-details");

  notificationsIcon.addEventListener("click", () => {
    notificationsDropdown.style.display =
      notificationsDropdown.style.display === "block" ? "none" : "block";
    userDetails.style.display = "none"; // Close user details if open
  });

  userProfile.addEventListener("click", () => {
    userDetails.style.display =
      userDetails.style.display === "block" ? "none" : "block";
    notificationsDropdown.style.display = "none"; // Close notifications if open
  });

  document.addEventListener("click", (event) => {
    if (
      !notificationsIcon.contains(event.target) &&
      !userProfile.contains(event.target)
    ) {
      notificationsDropdown.style.display = "none";
      userDetails.style.display = "none";
    }
  });

  const user = JSON.parse(sessionStorage.getItem("user"));
  if (user && user.idUsuario) {
    try {
      const response = await fetch(
        `/usuarios/imagem/${user.idUsuario}`
      );
      if (response.ok) {
        const imageData = await response.blob();
        const imageUrl = URL.createObjectURL(imageData);

        document.querySelectorAll(".perfil-imagem").forEach((imgElement) => {
          imgElement.src = imageUrl;
        });
      } else {
        document.querySelectorAll(".perfil-imagem").forEach((imgElement) => {
          imgElement.src = "../imgs/perfil_vazio.jpg";
        });
      }
    } catch (error) {
      console.error("Erro ao buscar imagem do perfil:", error);
      document.querySelectorAll(".perfil-imagem").forEach((imgElement) => {
        imgElement.src = "../imgs/perfil_vazio.jpg";
      });
    }
  } else {
    document.querySelectorAll(".perfil-imagem").forEach((imgElement) => {
      imgElement.src = "../imgs/perfil_vazio.jpg";
    });
  }

  try {
    const response = await fetch(
      `/usuarios/buscar/${user.idUsuario}`
    );
    if (!response.ok) {
      throw new Error("Erro ao buscar os dados do usuário");
    }
    const userData = await response.json();

    document.getElementById("editPrimeiroNomeUsuario").value =
      userData.primeiroNome;
    document.getElementById("editSobrenomeUsuario").value = userData.sobrenome;
    document.getElementById("editNomeUsuario").value = userData.nomeUsuario;
    document.getElementById("editEmailUsuario").value = userData.email;
  } catch (error) {
    console.error("Erro ao preencher os campos dos inputs:", error);
  }
});

document
  .getElementById("editProfileForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita o comportamento padrão de submissão do formulário

    const user = JSON.parse(sessionStorage.getItem("user"));

    const fileInput = document.getElementById("perfil-imagem-input");
    const file = fileInput.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("imagem", file);

      try {
        const response = await fetch(
          `/usuarios/atualizar-imagem/${user.idUsuario}`,
          {
            method: "PATCH",
            body: file,
            headers: {
              "Content-Type": "image/jpeg",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao atualizar a imagem do perfil");
        }

        console.log("Imagem do perfil atualizada com sucesso");
        window.location.reload();
      } catch (error) {
        console.error("Erro ao atualizar a imagem do perfil:", error);
      }
    } else {
      console.error("Nenhuma nova imagem selecionada");
    }
  });

document
  .getElementById("editProfileForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita o comportamento padrão de submissão do formulário

    const user = JSON.parse(sessionStorage.getItem("user"));

    const primeiroNome = document.getElementById(
      "editPrimeiroNomeUsuario"
    ).value;
    const sobrenome = document.getElementById("editSobrenomeUsuario").value;
    const nomeUsuario = document.getElementById("editNomeUsuario").value;
    const email = document.getElementById("editEmailUsuario").value;

    try {
      const response = await fetch(
        `/usuarios/atualizar/${user.idUsuario}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            primeiroNome: primeiroNome,
            sobrenome: sobrenome,
            nomeUsuario: nomeUsuario,
            email: email,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar o perfil do usuário");
      }

      console.log("Perfil do usuário atualizado com sucesso");

      user.nomeUsuario = nomeUsuario;
      sessionStorage.setItem("user", JSON.stringify(user));

      window.alert("Informações atualizadas com sucesso");

      window.location.reload();
    } catch (error) {
      window.alert("Erro ao atualizar o perfil do usuário:", error);
    }
  });
document
  .getElementById("confirmDeleteButton")
  .addEventListener("click", async function () {
    var email = document.getElementById("confirmEmail").value;
    var senha = document.getElementById("confirmPassword").value;

    if (!email || !senha) {
      alert("Por favor, preencha o email e a senha para confirmar a exclusão.");
      return;
    }
    try {
      const response = await fetch("/usuarios/deletar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          senha: senha,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir o perfil do usuário");
      }

      console.log("Perfil do usuário excluído com sucesso");

      window.location.href = "/html/home.html";
    } catch (error) {
      console.error("Erro ao excluir o perfil do usuário:", error);
      alert("Erro ao excluir o perfil do usuário. Por favor, tente novamente.");
    }
  });

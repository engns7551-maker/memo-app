const memoForm = document.querySelector("#memo-form");
const titleInput = document.querySelector("#memo-title");
const contentInput = document.querySelector("#memo-content");
const tagsInput = document.querySelector("#memo-tags");
const searchInput = document.querySelector("#search-input");
const memoList = document.querySelector("#memo-list");
const emptyMessage = document.querySelector("#empty-message");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");

const STORAGE_KEY = "simpleMemoApp.memos";

let memos = loadMemos();
let editingId = null;

renderMemos();

memoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const tags = parseTags(tagsInput.value);

  if (!title || !content) {
    return;
  }

  if (editingId) {
    updateMemo(editingId, title, content, tags);
  } else {
    addMemo(title, content, tags);
  }

  resetForm();
  saveMemos();
  renderMemos();
});

searchInput.addEventListener("input", renderMemos);
cancelButton.addEventListener("click", resetForm);

function loadMemos() {
  const savedMemos = localStorage.getItem(STORAGE_KEY);

  // localStorage에는 문자열만 저장되므로 JSON으로 다시 바꿉니다.
  const parsedMemos = savedMemos ? JSON.parse(savedMemos) : [];

  // 예전에 저장한 메모에는 tags가 없을 수 있어서 빈 배열을 넣어줍니다.
  return parsedMemos.map((memo) => ({
    ...memo,
    createdAt: memo.createdAt || "",
    tags: Array.isArray(memo.tags) ? memo.tags : []
  }));
}

function saveMemos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

function addMemo(title, content, tags) {
  const newMemo = {
    id: Date.now().toString(),
    title,
    content,
    tags,
    createdAt: new Date().toISOString()
  };

  memos.unshift(newMemo);
}

function updateMemo(id, title, content, tags) {
  memos = memos.map((memo) => {
    if (memo.id === id) {
      return { ...memo, title, content, tags };
    }

    return memo;
  });
}

function deleteMemo(id) {
  memos = memos.filter((memo) => memo.id !== id);

  if (editingId === id) {
    resetForm();
  }

  saveMemos();
  renderMemos();
}

function startEditing(id) {
  const memo = memos.find((item) => item.id === id);

  if (!memo) {
    return;
  }

  editingId = id;
  titleInput.value = memo.title;
  contentInput.value = memo.content;
  tagsInput.value = memo.tags.join(", ");
  saveButton.textContent = "수정하기";
  cancelButton.classList.remove("hidden");
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  memoForm.reset();
  saveButton.textContent = "저장하기";
  cancelButton.classList.add("hidden");
}

function renderMemos() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredMemos = memos.filter((memo) => {
    const title = memo.title.toLowerCase();
    const content = memo.content.toLowerCase();
    const tags = memo.tags.join(" ").toLowerCase();

    return title.includes(keyword) || content.includes(keyword) || tags.includes(keyword);
  });

  memoList.innerHTML = "";

  // 검색 결과까지 포함해 보여줄 메모가 없으면 안내 문구를 표시합니다.
  emptyMessage.classList.toggle("hidden", filteredMemos.length > 0);

  filteredMemos.forEach((memo) => {
    const memoCard = document.createElement("article");
    memoCard.className = "memo-card";

    const title = document.createElement("h3");
    title.textContent = memo.title;

    const date = document.createElement("time");
    date.className = "memo-date";
    date.textContent = formatDate(memo.createdAt);

    if (memo.createdAt) {
      date.dateTime = memo.createdAt;
    }

    const content = document.createElement("p");
    content.textContent = memo.content;

    const tags = document.createElement("div");
    tags.className = "memo-tags";

    memo.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.className = "tag-badge";
      badge.textContent = tag;
      tags.append(badge);
    });

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "수정";
    editButton.addEventListener("click", () => startEditing(memo.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteMemo(memo.id));

    actions.append(editButton, deleteButton);
    memoCard.append(title, date, content, tags, actions);
    memoList.append(memoCard);
  });
}

function formatDate(dateText) {
  if (!dateText) {
    return "작성일 없음";
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return "작성일 없음";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function parseTags(tagsText) {
  // 쉼표로 나눈 뒤 앞뒤 공백과 빈 태그를 정리합니다.
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

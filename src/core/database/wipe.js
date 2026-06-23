export function wipeAllData(db) {
  const run = db.transaction(() => {
    db.exec(`
      DELETE FROM bookmark_tags;
      DELETE FROM bookmark_state;
      DELETE FROM events;
      DELETE FROM bookmarks;
      DELETE FROM tags;
      DELETE FROM folders;
    `);
  });

  run();
}

export class Scheduler {
  #tasks = new Map();

  schedule(task) {
    this.cancel(task.id);

    const timer = setInterval(() => {
      void task.handler();
    }, task.intervalMs);

    this.#tasks.set(task.id, timer);
  }

  cancel(taskId) {
    const timer = this.#tasks.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.#tasks.delete(taskId);
    }
  }

  cancelAll() {
    for (const timer of this.#tasks.values()) {
      clearInterval(timer);
    }
    this.#tasks.clear();
  }
}

export class GetDashboardDataUseCase {
  constructor({ dashboardService }) {
    this.dashboardService = dashboardService;
  }

  execute(input) {
    return this.dashboardService.getData(input);
  }
}

export function assertCaseCardViewModels(viewModels = []) {
  viewModels.forEach((item, index) => {
    if (!item.id) throw new Error(`Case view model at index ${index} is missing id`);
    if (!item.employerName) throw new Error(`Case view model ${item.id} is missing employerName`);
    if (!item.stage) throw new Error(`Case view model ${item.id} is missing stage`);
    if (!item.meta) throw new Error(`Case view model ${item.id} is missing meta`);
  });
  return true;
}
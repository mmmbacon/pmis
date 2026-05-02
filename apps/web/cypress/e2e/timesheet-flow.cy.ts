describe('employee timesheet flow', () => {
  it('submits a week', () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').clear().type('employee@example.com');
    cy.get('[data-cy=password-input]').clear().type('password123');
    cy.get('[data-cy=login-submit]').click();
    cy.location('pathname').should('eq', '/timesheets');
    cy.get('[data-cy=save-timesheet]').click();
    cy.get('[data-cy=submit-timesheet]').click();
    cy.contains('submitted');
  });
});

describe('approver flow', () => {
  it('approves a submitted week', () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').clear().type('approver@example.com');
    cy.get('[data-cy=password-input]').clear().type('password123');
    cy.get('[data-cy=login-submit]').click();
    cy.contains('Approvals').click();
    cy.location('pathname').should('eq', '/approvals');
    cy.get('[data-cy=approval-card]')
      .first()
      .within(() => {
        cy.get('[data-cy=approve-timesheet]').click();
      });
    cy.contains('No submitted timesheets');
  });
});

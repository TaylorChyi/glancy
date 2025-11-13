import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const Identity = ({ children }) => children;

/**
 * Centralized renderer that wires up common providers such as MemoryRouter.
 * Additional wrappers can be supplied via the `wrapper` option which will be
 * composed inside the router by default.
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = "/",
    routerProps,
    withRouter = true,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options;

  const RouterWrapper = withRouter
    ? ({ children }) => (
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {children}
        </MemoryRouter>
      )
    : Identity;

  const Wrapper = CustomWrapper
    ? ({ children }) => (
        <RouterWrapper>
          <CustomWrapper>{children}</CustomWrapper>
        </RouterWrapper>
      )
    : RouterWrapper;

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export default renderWithProviders;

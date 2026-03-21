# Vision Startpage Project

## Overview

This project is a highly customizable and stylish startpage built with React. The goal is to create a visually appealing and functional dashboard that serves as a user's entry point to the web.

## Key Features & Design Principles

*   **Technology Stack:** The project is built using React and TypeScript.
*   **Aesthetics:** The user interface should have a modern, "glassy" or "frosted glass" look (neumorphism/glassmorphism). This involves using transparency, blur effects, and subtle shadows to create a sense of depth.
*   **Typography:** Specific font families and types will be used to maintain a consistent and elegant design.
*   **Modals:** All modals in the application should follow a specific and consistent design language, contributing to the overall user experience.
*   **Production Quality Code:** All code must be written to production standards, with a strong emphasis on readability, maintainability, and performance.
*   **Creative & Beautiful Code:** Code should not only be functional but also well-structured, elegant, and creative.

*   **Dropdown Component:** A reusable dropdown component (`components/Dropdown.tsx`) has been created for consistent styling and functionality across the application. It features a dark, glassy look with a custom arrow icon.

    **Usage Example:**
    ```typescript jsx
    import Dropdown from './components/Dropdown';

    // ... inside a React component
    <Dropdown
      options={[
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]}
      value={selectedValue}
      onChange={handleSelectChange}
      name="myDropdown"
    />
    ```

## Development Guidelines

* Follow the existing code style and conventions.
* Ensure all new components and features align with the established design principles.
* Write clean, commented, and reusable code.
* DO NOT run `npm run dev`, and instead, run `npm run build`.

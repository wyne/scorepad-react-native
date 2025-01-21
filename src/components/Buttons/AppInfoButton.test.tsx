import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { useNavigationMock } from "../../../test/test-helpers";
import { logEvent } from "../../Analytics";

import AppInfoButton from "./AppInfoButton";

jest.mock("../../Analytics");
jest.mock("expo-font"); // https://github.com/callstack/react-native-paper/issues/4561

describe("AppInfoButton", () => {
  const navigation = useNavigationMock();

  it("should navigate to AppInfo screen when pressed", () => {
    const { getByRole } = render(<AppInfoButton navigation={navigation} />);
    const button = getByRole("button");
    fireEvent.press(button);
    expect(navigation.navigate).toHaveBeenCalledWith("AppInfo");
  });

  it("should log an analytics event when pressed", async () => {
    const { getByRole } = render(<AppInfoButton navigation={navigation} />);
    const button = getByRole("button");

    fireEvent.press(button);

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith("app_info");
    });
  });
});

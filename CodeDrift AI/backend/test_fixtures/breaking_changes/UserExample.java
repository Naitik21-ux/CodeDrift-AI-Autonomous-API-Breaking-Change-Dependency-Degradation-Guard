
class User {
    public String getName() {
        return "Naitik";
    }
}

public class UserExample {

    public static void main(String[] args) {

        User user = new User();

        // This method call should be detected
        System.out.println(user.getName());

        // This method call should not be detected
        System.out.println(user.toString());
    }
}
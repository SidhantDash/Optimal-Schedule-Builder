package edu.uga.devdogs.course_information;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;

import edu.uga.devdogs.course_information.Professor.Professor;
import edu.uga.devdogs.course_information.Professor.ProfessorRepository;
import edu.uga.devdogs.course_information.Building.Building;
import edu.uga.devdogs.course_information.Building.BuildingRepository;
import edu.uga.devdogs.course_information.Class.ClassEntity;
import edu.uga.devdogs.course_information.Class.ClassRepository;
import edu.uga.devdogs.course_information.Course.Course;
import edu.uga.devdogs.course_information.Course.CourseRepository;
import edu.uga.devdogs.course_information.CourseSection.CourseSection;
import edu.uga.devdogs.course_information.CourseSection.CourseSectionRepository;
import edu.uga.devdogs.course_information.webscraping.DescriptionScraper;
import edu.uga.devdogs.course_information.webscraping.Course2;
import edu.uga.devdogs.course_information.webscraping.Pdf;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
@EnableTransactionManagement
public class CourseInformationApplication {

    private final CourseRepository courseRepository;
    private final BuildingRepository buildingRepository;
    private final ProfessorRepository professorRepository;

    @Value("${update.buildings}")
    private boolean updateBuildings;

    CourseInformationApplication(BuildingRepository buildingRepository, CourseRepository courseRepository, ProfessorRepository professorRepository) {
        this.courseRepository = courseRepository;
        this.buildingRepository = buildingRepository;
        this.professorRepository = professorRepository;
    }

    public static void main(String[] args) {
        SpringApplication.run(CourseInformationApplication.class, args);
    }

@Bean
@Order(2)
@Transactional
@Scheduled(cron = "0 0 4 * * *", zone = "America/New_York") // 12 hours
CommandLineRunner courseSecCommandLineRunner(
        CourseSectionRepository courseSectionRepository,
        CourseRepository courseRepository,
        ClassRepository classRepository,
        BuildingRepository buildingRepository,
        ProfessorRepository professorRepository) {
    
    return args -> {
        FirefoxOptions options = new FirefoxOptions();
        options.addArguments("--headless");
        WebDriver driver = new FirefoxDriver(options);
        DescriptionScraper scraper = new DescriptionScraper(driver);

        List<Course2> courses = Pdf.parsePdf("spring", "C:\\kadestyron\\d\\Desktop");

        List<Course> courseEntities = new ArrayList<>();
        List<ClassEntity> classEntities = new ArrayList<>();
        List<CourseSection> courseSections = new ArrayList<>();
        Set<String> processedCourses = new HashSet<>();
        Map<String, Integer> professorIdCache = new HashMap<>();

        for (Course2 course : courses) {
            if (course.getClassSize() == 0) continue;

            String courseKey = course.getSubject() + "-" + course.getCourseNumber();

            String creditHoursStr = course.getCreditHours().replaceAll("[^0-9.-]", "").trim();


            int creditHours = 3;
            if (creditHoursStr.contains("-")) {
                try {
                    creditHours = (int) Float.parseFloat(creditHoursStr.split("-")[0].trim());
                } catch (NumberFormatException e) {
                    System.err.println("Invalid credit hours: " + course.getCreditHours());
                }
            }

            String[] times = course.getMeetingTimes().split("-");
            String startTime = times.length > 0 ? times[0].trim() : "";
            String endTime = times.length > 1 ? times[1].trim() : "";
            LocalTime start = parseTime(startTime);
            LocalTime end = parseTime(endTime);


            String professorLastName = course.getProfessor();
            Professor existingProfessor = null;

            if (professorLastName != null && !professorLastName.trim().isEmpty()) {
                professorLastName = professorLastName.trim();

                if (professorIdCache.containsKey(professorLastName)) {
                    Integer cachedId = professorIdCache.get(professorLastName);
                    existingProfessor = professorRepository.findById(cachedId).orElse(null);
                } else {
                    Professor newProfessor = new Professor(
                        "", professorLastName, 10, 3.0f, 3.0f, 50, course.getDepartment()
                    );
                    professorRepository.saveAndFlush(newProfessor);
                    professorIdCache.put(professorLastName, newProfessor.getProfessorId());
                    existingProfessor = newProfessor;
                }
            }

            Course existingCourse = courseRepository.findBySubjectAndCourseNumber(course.getSubject(), course.getCourseNumber());
            Course courseEntity;

            if (existingCourse == null) {
                String description = "Description not found";
                try {
                    description = scraper.getCourseDescription(course.getSubject(), course.getCourseNumber());
                } catch (Exception e) {
                    System.err.println("Error fetching description for " + course.getSubject() + " " + course.getCourseNumber());
                    description = "Description not found"; // fallback
                }

                courseEntity = new Course(course.getSubject(), course.getCourseNumber(), course.getTitle(), course.getDepartment(), courseSections, description);
                courseRepository.save(courseEntity);
                courseEntities.add(courseEntity);
            } else {
                existingCourse.updateFrom(course);
                courseEntity = existingCourse;
            }

            processedCourses.add(courseKey);

            CourseSection existingSection = courseSectionRepository.findByCrn(course.getCrn());
            if (existingSection != null) {
                courseSectionRepository.delete(existingSection);  // Delete old section
            }

            CourseSection newCourseSection = new CourseSection();
            newCourseSection.updateFrom(course, existingProfessor, start, end);
            newCourseSection.setCourse(courseEntity);


            Building building = buildingRepository.findByBuildingCode(course.getBuilding());
            if (building == null) {
                System.err.println("Building not found: " + course.getBuilding());
                continue;
            }

            ClassEntity newClassEntity = new ClassEntity();

            newClassEntity.updateFrom(course, start, end, building);
            newClassEntity.setCourseSection(newCourseSection);


            courseSections.add(newCourseSection);
            classEntities.add(newClassEntity);
        }

        System.out.println("Saving to database...");
        courseRepository.saveAll(courseEntities);
        courseSectionRepository.saveAll(courseSections);
        classRepository.saveAll(classEntities);
        driver.quit();
        System.out.println("Database updated successfully.");
    };
}


    @Bean
    @Order(1)
    CommandLineRunner buildingCommandLineRunner(BuildingRepository buildingRepository) {
        return args -> {
            String buildingsJsonPath = "buildingData/AthensBuildingData.json";
            ClassPathResource resource = new ClassPathResource(buildingsJsonPath);

            if (!resource.exists()) {
                System.err.println("File not found at path: " + buildingsJsonPath);
                return;
            }

            try (InputStream inputStream = resource.getInputStream()) {
                ObjectMapper objectMapper = new ObjectMapper();
                CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, Building.class);
                List<Building> buildings = objectMapper.readValue(inputStream, listType);

                List<Building> buildingsToSave = new ArrayList<>();
                for (Building building : buildings) {
                    if (!buildingRepository.existsById(building.getBuildingCode())) {
                        buildingsToSave.add(building);
                    }
                }

                if (!buildingsToSave.isEmpty()) {
                    buildingRepository.saveAll(buildingsToSave);
                    System.out.println("Buildings saved successfully.");
                } else {
                    System.out.println("No new buildings to save.");
                }

            } catch (IOException e) {
                System.err.println("Failed to read or parse buildings.json: " + e.getMessage());
            }
        };
    }

    private LocalTime parseTime(String time) {
        try {
            if (time == null || time.isEmpty() || time.trim().equals("TBA")) {
                return null;
            }
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mma");
            return LocalTime.parse(time.toUpperCase(), formatter);
        } catch (DateTimeParseException e) {
            System.err.println("Invalid time format: " + time);
            return null;
        }
    }
}

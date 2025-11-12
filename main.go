package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"slices"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type student struct {
	StudentNumber string `json:"student_number"`
	SpecificSeat  int    `json:"specific_seat"`
}

type post struct {
	Seatlength   int   `json:"seatlength"`
	Position     []int `json:"position"`
	SpecificSeat []int `json:"specificSeat"`
}

type classroom struct {
	Seats        []int `json:"seats"`
	Position     []int `json:"position"`
	SpecificSeat []int `json:"specificSeat"`
	CurrentIndex int   `json:"currentIndex"`
	Result       []int `json:"result"`
}

type store struct {
	classrooms map[string]*classroom
	mutex      sync.Mutex
	filepath   string
}

func newStore(filepath string) *store {
	store := &store{
		classrooms: make(map[string]*classroom),
		filepath:   filepath,
	}

	if err := store.load(); err != nil {
		log.Printf("Error loading data, starting fresh: %v", err)
	}

	return store
}

func (s *store) load() error {
	data, err := os.ReadFile(s.filepath)
	if err != nil {
		return err
	}
	if len(data) == 0 {
		return nil
	}
	err = json.Unmarshal(data, &s.classrooms)
	return err
}

func (s *store) createClassroom(seatlength int, position []int, specificSeat []int) string {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	uuidv1, err := uuid.NewUUID()
	if err != nil {
		log.Printf("Error generating UUID: %v", err)
	}
	var classcode = strings.Split(uuidv1.String(), "-")[0][0:5]

	seats := make([]int, seatlength)
	for i := 0; i < seatlength; i++ {
		seats[i] = i + 1
	}
	rand.Shuffle(len(seats), func(i, j int) {
		seats[i], seats[j] = seats[j], seats[i]
	})

	newClass := &classroom{
		Seats:        seats,
		Position:     position,
		SpecificSeat: specificSeat,
		CurrentIndex: 0,
		Result:       make([]int, seatlength),
	}

	s.classrooms[classcode] = newClass

	return classcode
}

func (s *store) getClassroom(classcode string) (*classroom, bool) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	class, exits := s.classrooms[classcode]

	return class, exits
}

func (s *store) save() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := json.MarshalIndent(s.classrooms, "", "  ")
	if err != nil {
		log.Printf("Error marshaling data: %v", err)
	}

	os.WriteFile(s.filepath, data, 0644)
}

func main() {
	addr := flag.String("addr", ":8080", "address to listen on")
	flag.Parse()

	file := "./db.json"

	route := gin.Default()

	route.Static("/app", "./public")

	store := newStore(file)

	// create classroom from /admin
	route.POST("/create", func(c *gin.Context) {
		var body post
		if err := c.BindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			log.Printf("Error binding JSON: %v", err)
			return
		}
		var classcode = strconv.Itoa(rand.Intn(9000) + 1000)

		classcode = store.createClassroom(body.Seatlength, body.Position, body.SpecificSeat)
		store.save()

		c.JSON(200, gin.H{"message": classcode})
	})

	//return classroom data (json)
	route.GET("/classroom/:classcode", func(c *gin.Context) {
		var classcode = c.Param("classcode")
		class, exists := store.getClassroom(classcode)
		if !exists {
			c.JSON(404, gin.H{"error": "Classroom not found"})
			return
		}
		c.JSON(200, class)
	})

	//receive student number from /user
	route.POST("/classroom/:classcode", func(c *gin.Context) {
		var student student
		if err := c.BindJSON(&student); err != nil {
			c.JSON(200, gin.H{"error": "Invalid request"})
			log.Printf("Error binding JSON: %v", err)
			return
		}
		studentNumber, err := strconv.Atoi(student.StudentNumber)
		if err != nil {
			c.JSON(200, gin.H{"error": "Invalid request"})

		}
		var classcode = c.Param("classcode")

		// store.mutex.Lock()
		// defer store.mutex.Unlock()
		var class, exists = store.classrooms[classcode]
		if !exists {
			c.JSON(200, gin.H{"error": "Classroom not found"})
			return
		}

		if studentNumber < 1 || studentNumber > len(class.Result) {
			c.JSON(200, gin.H{"error": "Invalid student number. It is out of range."})
			return
		}

		if class.Result[studentNumber-1] != 0 {
			// if seat already be allocated, just return the result with index:-1
			// Because index is just for debug, not used in production.
			c.JSON(200, gin.H{"message": class.Result[studentNumber-1], "index": -1})
			return
		}

		if class.CurrentIndex >= len(class.Result) {
			c.JSON(200, gin.H{"error": "No more seats available"})
			return
		}

		log.Println(student.SpecificSeat)

		if student.SpecificSeat != -1 {
			if slices.Contains(class.SpecificSeat, student.SpecificSeat) {
				class.Result[studentNumber-1] = student.SpecificSeat
				seatIndex := slices.Index(class.SpecificSeat, student.SpecificSeat)
				class.SpecificSeat = slices.Delete(class.SpecificSeat, seatIndex, seatIndex+1)
				seatIndex = slices.Index(class.Seats, student.SpecificSeat)
				class.SpecificSeat = slices.Delete(class.Seats, seatIndex, seatIndex+1)
			} else {
				c.JSON(200, gin.H{"error": "No permission"})
				return
			}
		} else {
			class.Result[studentNumber-1] = class.Seats[class.CurrentIndex]
			class.CurrentIndex++
		}

		store.save()
		c.JSON(200, gin.H{"message": class.Result[studentNumber-1], "index": store.classrooms[classcode].CurrentIndex - 1})
	})

	route.GET("/", func(ctx *gin.Context) {
		ctx.Redirect(301, "/app")
	})

	fmt.Println("Listening on", *addr)
	err := route.Run(*addr)
	if err != nil {
		log.Fatal(err)
	}
}
